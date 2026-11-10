import { Router, Request, Response } from 'express';
import { Lead } from '../models/Lead';
import { Campaign } from '../models/Campaign';
import { Quotation } from '../models/Quotation';
import { ScheduleEvent } from '../models/ScheduleEvent';
import { BrochureDownload } from '../models/BrochureDownload';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/reports/analytics — Aggregated CRM reporting metrics
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, employee, source, status } = req.query;

    const leadFilter: any = {};
    if (source && source !== 'All') leadFilter.source = source;
    if (status && status !== 'All') leadFilter.status = status;
    if (employee && employee !== 'All') leadFilter.assignedTo = employee;

    if (startDate || endDate) {
      leadFilter.createdAt = {};
      if (startDate) leadFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        leadFilter.createdAt.$lte = end;
      }
    }

    // 1. Leads Analytics
    const [allLeads, totalLeadsCount] = await Promise.all([
      Lead.find(leadFilter).populate('assignedTo', 'name email role').lean(),
      Lead.countDocuments(),
    ]);

    const leadsByStatus: Record<string, number> = {};
    const leadsBySource: Record<string, number> = {};
    const leadsByProduct: Record<string, number> = {};

    allLeads.forEach((l) => {
      leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
      leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;
      leadsByProduct[l.interestedProduct] = (leadsByProduct[l.interestedProduct] || 0) + 1;
    });

    const wonLeads = allLeads.filter((l) => l.status === 'Won').length;
    const conversionRate = allLeads.length > 0 ? Number(((wonLeads / allLeads.length) * 100).toFixed(1)) : 0;
    const unassignedLeads = allLeads.filter((l) => !l.assignedTo).length;

    // 2. Campaigns Analytics
    const campaigns = await Campaign.find().lean();
    const totalCampaignSpend = campaigns.reduce((acc, c) => acc + (c.actualSpend || 0), 0);
    const campaignLeads = campaigns.reduce((acc, c) => acc + (c.leadsGenerated || 0), 0);
    const campaignConversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);
    const campaignRevenue = campaigns.reduce((acc, c) => acc + (c.revenueGenerated || 0), 0);
    const averageCPL = campaignLeads > 0 ? Number((totalCampaignSpend / campaignLeads).toFixed(0)) : 0;
    const overallCampaignROI =
      totalCampaignSpend > 0
        ? Number((((campaignRevenue - totalCampaignSpend) / totalCampaignSpend) * 100).toFixed(1))
        : 0;

    // 3. Quotations Analytics
    const quotes = await Quotation.find().lean();
    const totalQuotesCount = quotes.length;
    const acceptedQuotes = quotes.filter((q) => q.status === 'Accepted');
    const totalQuotationValue = quotes.reduce((acc, q) => acc + (q.grandTotal || 0), 0);
    const acceptedQuotationValue = acceptedQuotes.reduce((acc, q) => acc + (q.grandTotal || 0), 0);
    const quotationAcceptanceRate =
      totalQuotesCount > 0 ? Number(((acceptedQuotes.length / totalQuotesCount) * 100).toFixed(1)) : 0;

    // 4. Schedule & Meetings Analytics
    const meetings = await ScheduleEvent.find().lean();
    const completedMeetings = meetings.filter((m) => m.status === 'Completed').length;
    const upcomingMeetings = meetings.filter((m) => ['Scheduled', 'Confirmed'].includes(m.status)).length;

    // 5. Brochure Downloads Analytics
    const brochures = await BrochureDownload.find().lean();
    const repeatDownloads = brochures.filter((b) => b.isRepeat || b.downloadCount > 1).length;
    const convertedBrochures = brochures.filter((b) => b.status === 'Converted').length;

    // 6. Employee Performance Breakdown
    const users = await User.find({ isActive: true }, { name: 1, email: 1, role: 1 }).lean();
    const employeePerformance = users.map((u) => {
      const userLeads = allLeads.filter((l) => l.assignedTo && (l.assignedTo as any)._id?.toString() === u._id.toString());
      const userWon = userLeads.filter((l) => l.status === 'Won').length;
      const rate = userLeads.length > 0 ? Number(((userWon / userLeads.length) * 100).toFixed(1)) : 0;

      return {
        userId: u._id,
        name: u.name,
        role: u.role,
        assignedLeads: userLeads.length,
        wonLeads: userWon,
        conversionRate: rate,
      };
    });

    res.json({
      success: true,
      summary: {
        totalLeads: allLeads.length,
        conversionRate,
        unassignedLeads,
        wonLeads,
        totalCampaignSpend,
        campaignRevenue,
        overallCampaignROI,
        averageCPL,
        totalQuotationValue,
        acceptedQuotationValue,
        quotationAcceptanceRate,
        totalMeetings: meetings.length,
        completedMeetings,
        upcomingMeetings,
        totalBrochures: brochures.length,
        repeatDownloads,
        convertedBrochures,
      },
      distributions: {
        byStatus: leadsByStatus,
        bySource: leadsBySource,
        byProduct: leadsByProduct,
      },
      campaignsSummary: campaigns.map((c) => ({
        id: c.campaignId,
        name: c.name,
        type: c.type,
        status: c.status,
        spend: c.actualSpend,
        leads: c.leadsGenerated,
        conversions: c.conversions,
        revenue: c.revenueGenerated,
        roi: c.actualSpend > 0 ? Number((((c.revenueGenerated - c.actualSpend) / c.actualSpend) * 100).toFixed(1)) : 0,
      })),
      employeePerformance,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;

