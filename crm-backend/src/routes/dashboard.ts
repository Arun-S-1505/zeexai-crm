import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Lead } from '../models/Lead';
import { ScheduleEvent } from '../models/ScheduleEvent';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'New' });
    const qualifiedLeads = await Lead.countDocuments({ status: 'Qualified' });
    const pendingFollowUps = await Lead.countDocuments({
      status: { $in: ['Contacted', 'Demo Scheduled', 'Negotiation', 'Proposal Sent'] },
    });

    res.json({
      success: true,
      data: {
        totalLeads: { value: totalLeads, change: '+12.5%' },
        newLeads: { value: newLeads, change: '+8.2%' },
        qualifiedLeads: { value: qualifiedLeads, change: '+18.4%' },
        pendingFollowUps: { value: pendingFollowUps, change: '-4.3%' },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/dashboard/acquisition-chart
router.get('/acquisition-chart', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Return sample curve metadata / real distribution
    res.json({
      success: true,
      data: {
        labels: ['May 20', 'May 27', 'Jun 03', 'Jun 10', 'Jun 17'],
        newLeads: [18, 28, 22, 38, 42],
        qualifiedLeads: [8, 14, 19, 25, 32],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/dashboard/pipeline-funnel
router.get('/pipeline-funnel', async (_req: Request, res: Response): Promise<void> => {
  try {
    const newCount = await Lead.countDocuments({ status: 'New' });
    const contactedCount = await Lead.countDocuments({ status: 'Contacted' });
    const qualifiedCount = await Lead.countDocuments({ status: 'Qualified' });
    const proposalCount = await Lead.countDocuments({ status: 'Proposal Sent' });
    const wonCount = await Lead.countDocuments({ status: 'Won' });
    const total = await Lead.countDocuments();

    const conversionRate = total > 0 ? ((wonCount / total) * 100).toFixed(1) + '%' : '0%';

    res.json({
      success: true,
      data: {
        stages: [
          { name: 'New leads', count: newCount, percentage: 100 },
          { name: 'Contacted', count: contactedCount, percentage: total ? Math.round((contactedCount / total) * 100) : 0 },
          { name: 'Qualified', count: qualifiedCount, percentage: total ? Math.round((qualifiedCount / total) * 100) : 0 },
          { name: 'Proposal sent', count: proposalCount, percentage: total ? Math.round((proposalCount / total) * 100) : 0 },
          { name: 'Won', count: wonCount, percentage: total ? Math.round((wonCount / total) * 100) : 0 },
        ],
        conversionRate,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/dashboard/todays-schedule
router.get('/todays-schedule', async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let events = await ScheduleEvent.find({
      date: { $gte: today, $lt: tomorrow },
    }).sort({ time: 1 });

    // If none specifically for today, return latest scheduled items
    if (events.length === 0) {
      events = await ScheduleEvent.find().sort({ date: -1 }).limit(3);
    }

    res.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', async (_req: Request, res: Response): Promise<void> => {
  try {
    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const activity = recentLeads.map((l) => ({
      id: l._id,
      icon: l.status === 'Won' ? 'check' : l.status === 'New' ? 'lead' : 'mail',
      text: `Lead ${l.status.toLowerCase()} for`,
      bold: `${l.firstName} ${l.lastName} (${l.company})`,
      time: new Date(l.createdAt).toLocaleDateString(),
    }));

    res.json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;

