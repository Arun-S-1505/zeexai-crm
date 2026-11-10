import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { Lead } from '../models/Lead';
import { User } from '../models/User';
import { LeadAssignmentHistory } from '../models/LeadAssignmentHistory';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();
router.use(authenticate);

// GET /api/assignments/leads — Listing leads with assignment state
router.get('/leads', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const priority = (req.query.priority as string) || '';
    const assignedTo = (req.query.assignedTo as string) || '';
    const unassignedOnly = req.query.unassigned === 'true';

    const filter: any = {};

    if (unassignedOnly) {
      filter.assignedTo = null;
    } else if (assignedTo && assignedTo !== 'All') {
      filter.assignedTo = assignedTo;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (priority && priority !== 'All') {
      filter.priority = priority;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { leadId: regex },
        { firstName: regex },
        { lastName: regex },
        { company: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const total = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/assignments/metrics — Top dashboard metrics
router.get('/metrics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const allLeads = await Lead.find({}, { assignedTo: 1, assignedAt: 1, nextFollowUp: 1, status: 1 }).lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalLeads = allLeads.length;
    const assignedLeads = allLeads.filter((l) => l.assignedTo).length;
    const unassignedLeads = totalLeads - assignedLeads;

    const assignedToday = allLeads.filter(
      (l) => l.assignedAt && new Date(l.assignedAt) >= today
    ).length;

    const overdueFollowUps = allLeads.filter(
      (l) => l.nextFollowUp && new Date(l.nextFollowUp) < new Date() && !['Won', 'Lost'].includes(l.status)
    ).length;

    res.json({
      success: true,
      metrics: {
        totalLeads,
        assignedLeads,
        unassignedLeads,
        assignedToday,
        overdueFollowUps,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/assignments/workload — Employee workload breakdown
router.get('/workload', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ isActive: true }, { name: 1, email: 1, role: 1 }).lean();
    const leads = await Lead.find({}, { assignedTo: 1, status: 1, nextFollowUp: 1 }).lean();

    const now = new Date();
    const openStatuses = ['New', 'Contacted', 'Qualified', 'Demo Scheduled', 'Proposal Sent', 'Negotiation'];

    const workload = users.map((u) => {
      const userLeads = leads.filter((l) => l.assignedTo && l.assignedTo.toString() === u._id.toString());
      const totalAssigned = userLeads.length;
      const openLeads = userLeads.filter((l) => openStatuses.includes(l.status)).length;
      const convertedLeads = userLeads.filter((l) => l.status === 'Won').length;
      const overdue = userLeads.filter(
        (l) => l.nextFollowUp && new Date(l.nextFollowUp) < now && openStatuses.includes(l.status)
      ).length;

      return {
        userId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalAssigned,
        openLeads,
        convertedLeads,
        overdueFollowUps: overdue,
      };
    });

    res.json({ success: true, data: workload });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/assignments/assign — Single lead assignment
router.post(
  '/assign',
  [
    body('leadId').notEmpty().withMessage('Lead identifier is required'),
    body('assignedTo').notEmpty().withMessage('Assignee user ID is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { leadId, assignedTo, reason, priority, notes, nextFollowUp } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?._id;

      const lead = await Lead.findById(leadId);
      if (!lead) {
        res.status(404).json({ success: false, message: 'Lead not found' });
        return;
      }

      const previousAssignee = lead.assignedTo;
      lead.assignedTo = assignedTo;
      lead.assignedAt = new Date();
      if (reason) lead.assignmentReason = reason;
      if (notes) lead.assignmentNotes = notes;
      if (priority) lead.priority = priority;
      if (nextFollowUp) lead.nextFollowUp = new Date(nextFollowUp);
      lead.lastActivityDate = new Date();

      await lead.save();

      // Write assignment audit history
      await LeadAssignmentHistory.create({
        lead: lead._id,
        leadId: lead.leadId,
        previousAssignee: previousAssignee || null,
        newAssignee: assignedTo,
        assignedBy: userId || null,
        assignedAt: new Date(),
        reason: reason || 'Direct assignment',
        priority: priority || lead.priority,
        notes: notes || '',
        method: previousAssignee ? 'Reassignment' : 'Manual',
      });

      const updated = await Lead.findById(lead._id).populate('assignedTo', 'name email role');
      res.json({ success: true, data: updated, message: `Lead assigned successfully` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to assign lead' });
    }
  }
);

// POST /api/assignments/bulk-assign — Bulk lead assignment
router.post(
  '/bulk-assign',
  [
    body('leadIds').isArray({ min: 1 }).withMessage('At least one lead ID required'),
    body('assignedTo').notEmpty().withMessage('Assignee user ID is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { leadIds, assignedTo, reason, priority, notes } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?._id;

      const leads = await Lead.find({ _id: { $in: leadIds } });
      const historyDocs = [];

      for (const lead of leads) {
        const previousAssignee = lead.assignedTo;
        lead.assignedTo = assignedTo;
        lead.assignedAt = new Date();
        if (reason) lead.assignmentReason = reason;
        if (priority) lead.priority = priority;
        if (notes) lead.assignmentNotes = notes;
        lead.lastActivityDate = new Date();
        await lead.save();

        historyDocs.push({
          lead: lead._id,
          leadId: lead.leadId,
          previousAssignee: previousAssignee || null,
          newAssignee: assignedTo,
          assignedBy: userId || null,
          assignedAt: new Date(),
          reason: reason || 'Bulk assignment',
          priority: priority || lead.priority,
          notes: notes || '',
          method: 'Bulk',
        });
      }

      if (historyDocs.length > 0) {
        await LeadAssignmentHistory.insertMany(historyDocs);
      }

      res.json({
        success: true,
        message: `Successfully assigned ${leads.length} leads in bulk`,
        count: leads.length,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Bulk assignment failed' });
    }
  }
);

// POST /api/assignments/round-robin — Automated round-robin distribution
router.post('/round-robin', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?._id;
    // Find active staff (admins and sales reps)
    const staff = await User.find({ isActive: true, role: { $in: ['ADMIN', 'SUPERADMIN', 'INTERN', 'SALES_REP'] } });
    if (staff.length === 0) {
      res.status(400).json({ success: false, message: 'No active staff available for round-robin assignment' });
      return;
    }

    // Get unassigned leads or specific leads if provided
    const targetFilter = req.body.leadIds && req.body.leadIds.length > 0
      ? { _id: { $in: req.body.leadIds } }
      : { assignedTo: null };

    const leads = await Lead.find(targetFilter);
    if (leads.length === 0) {
      res.json({ success: true, message: 'No unassigned leads found to distribute', assignedCount: 0 });
      return;
    }

    const historyDocs = [];
    let staffIndex = 0;

    for (const lead of leads) {
      const assignedEmployee = staff[staffIndex % staff.length];
      const previousAssignee = lead.assignedTo;

      lead.assignedTo = assignedEmployee._id;
      lead.assignedAt = new Date();
      lead.assignmentReason = 'Automated Round-Robin Distribution';
      lead.lastActivityDate = new Date();
      await lead.save();

      historyDocs.push({
        lead: lead._id,
        leadId: lead.leadId,
        previousAssignee: previousAssignee || null,
        newAssignee: assignedEmployee._id,
        assignedBy: userId || null,
        assignedAt: new Date(),
        reason: 'Automated Round-Robin Distribution',
        priority: lead.priority,
        notes: `Distributed to ${assignedEmployee.name}`,
        method: 'Round-Robin',
      });

      staffIndex++;
    }

    if (historyDocs.length > 0) {
      await LeadAssignmentHistory.insertMany(historyDocs);
    }

    res.json({
      success: true,
      message: `Evenly distributed ${leads.length} leads across ${staff.length} staff members`,
      assignedCount: leads.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Round-robin distribution failed' });
  }
});

// GET /api/assignments/history/:leadId — History of assignments for a lead
router.get('/history/:leadId', async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await LeadAssignmentHistory.find({
      $or: [{ lead: req.params.leadId }, { leadId: req.params.leadId }],
    })
      .populate('previousAssignee', 'name email role')
      .populate('newAssignee', 'name email role')
      .populate('assignedBy', 'name email role')
      .sort({ assignedAt: -1 })
      .lean();

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch history' });
  }
});

export default router;

