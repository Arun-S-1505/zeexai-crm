import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { ScheduleEvent } from '../models/ScheduleEvent';

const router = Router();
router.use(authenticate);

// GET /api/schedule
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { start, end, type, status, employeeId, search } = req.query;

    const filter: any = {};

    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start as string);
      if (end) {
        const endDate = new Date(end as string);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    if (type && type !== 'All') {
      filter.type = type;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (employeeId && employeeId !== 'All') {
      filter.assignedTo = employeeId;
    }

    if (search && (search as string).trim()) {
      const regex = new RegExp((search as string).trim(), 'i');
      filter.$or = [
        { title: regex },
        { contactName: regex },
        { company: regex },
        { locationOrLink: regex },
      ];
    }

    const events = await ScheduleEvent.find(filter)
      .populate('relatedLead', 'leadId firstName lastName company email phone status')
      .populate('assignedTo', 'name email role')
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Summary counters
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalCount = await ScheduleEvent.countDocuments();
    const todayCount = await ScheduleEvent.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'Cancelled' },
    });
    const upcomingCount = await ScheduleEvent.countDocuments({
      date: { $gt: todayEnd },
      status: { $in: ['Scheduled', 'Confirmed'] },
    });
    const completedCount = await ScheduleEvent.countDocuments({ status: 'Completed' });
    const overdueCount = await ScheduleEvent.countDocuments({
      date: { $lt: todayStart },
      status: { $in: ['Scheduled', 'Confirmed'] },
    });

    res.json({
      success: true,
      data: events,
      metrics: {
        total: totalCount,
        today: todayCount,
        upcoming: upcomingCount,
        completed: completedCount,
        overdue: overdueCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/schedule/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await ScheduleEvent.findById(req.params.id)
      .populate('relatedLead')
      .populate('assignedTo', 'name email role');
    if (!event) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/schedule
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Appointment title is required'),
    body('type').trim().notEmpty().withMessage('Meeting type is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('startTime').trim().notEmpty().withMessage('Start time is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        contactName,
        company,
        type,
        date,
        startTime,
        endTime,
        status,
        relatedLead,
        assignedTo,
        locationOrLink,
        description,
        reminder,
        notes,
        color,
      } = req.body;

      const finalAssignedTo = assignedTo || (req as any).user?.userId || (req as any).user?._id;

      // Duplicate booking check: prevent double-booking assigned employee on same date & time
      if (finalAssignedTo && date && startTime) {
        const meetingDate = new Date(date);
        meetingDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(meetingDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const conflict = await ScheduleEvent.findOne({
          assignedTo: finalAssignedTo,
          date: { $gte: meetingDate, $lt: nextDay },
          startTime,
          status: { $in: ['Scheduled', 'Confirmed'] },
        });

        if (conflict) {
          res.status(409).json({
            success: false,
            message: `Conflict detected: An active meeting ("${conflict.title}") is already scheduled at ${startTime} on this date.`,
          });
          return;
        }
      }

      // Determine UI color based on type
      let chosenColor = color;
      if (!chosenColor) {
        if (type === 'Product Demo') chosenColor = 'blue';
        else if (type === 'Discovery Call') chosenColor = 'purple';
        else if (type === 'Sales Meeting') chosenColor = 'green';
        else if (type === 'Technical Discussion') chosenColor = 'amber';
        else chosenColor = 'purple';
      }

      const event = new ScheduleEvent({
        title,
        contactName: contactName || '',
        company: company || '',
        type,
        date: new Date(date),
        startTime,
        endTime: endTime || '',
        status: status || 'Scheduled',
        relatedLead: relatedLead || null,
        assignedTo: assignedTo || req.user?.userId || null,
        locationOrLink: locationOrLink || '',
        description: description || '',
        reminder: reminder || '15 min before',
        notes: notes || '',
        color: chosenColor,
      });

      await event.save();
      const populated = await ScheduleEvent.findById(event._id)
        .populate('relatedLead', 'leadId firstName lastName company email phone')
        .populate('assignedTo', 'name email role');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
);

// PATCH /api/schedule/:id
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData = { ...req.body };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const event = await ScheduleEvent.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('relatedLead', 'leadId firstName lastName company email phone')
      .populate('assignedTo', 'name email role');

    if (!event) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// DELETE /api/schedule/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await ScheduleEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;
