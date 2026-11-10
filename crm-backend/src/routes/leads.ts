import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { Lead } from '../models/Lead';

const router = Router();
router.use(authenticate);

// GET /api/leads
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = (req.query.search as string) || '';
      const product = (req.query.product as string) || '';
      const status = (req.query.status as string) || '';
      const priority = (req.query.priority as string) || '';

      const filter: any = {};

      if (product && product !== 'All products') {
        filter.interestedProduct = product;
      }
      if (status) {
        filter.status = status;
      }
      if (priority) {
        filter.priority = priority;
      }
      if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { firstName: regex },
          { lastName: regex },
          { company: regex },
          { email: regex },
          { leadId: regex },
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
  }
);

// POST /api/leads
router.post(
  '/',
  [
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('company').trim().notEmpty().withMessage('Company name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('interestedProduct').isIn(['Z-Factory', 'Z-Tracs', 'Z-Market', 'Z-Drone', 'Z-Consultancy']).withMessage('Invalid product'),
    body('source').optional().isIn(['Website enquiry', 'Brochure download', 'Marketing campaign', 'Referral', 'Direct outreach', 'Contact form']),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const leadData = {
        ...req.body,
        source: req.body.source || 'Direct outreach',
        priority: req.body.priority || 'Medium',
        status: 'New',
      };

      const lead = new Lead(leadData);
      await lead.save();

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
);

// GET /api/leads/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email role');
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// PATCH /api/leads/:id
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    res.json({ success: true, message: 'Lead updated successfully', data: lead });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// DELETE /api/leads/:id (SUPERADMIN or ADMIN only)
router.delete('/:id', requireRole('SUPERADMIN', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;

