import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { Campaign } from '../models/Campaign';
import { Lead } from '../models/Lead';

const router = Router();
router.use(authenticate);

// Helper to compute calculated financial & conversion metrics safely
export const computeCampaignMetrics = (campaign: any) => {
  const leads = campaign.leadsGenerated || 0;
  const spend = campaign.actualSpend || 0;
  const conversions = campaign.conversions || 0;
  const revenue = campaign.revenueGenerated || 0;

  const conversionRate = leads > 0 ? Number(((conversions / leads) * 100).toFixed(2)) : 0;
  const costPerLead = leads > 0 ? Number((spend / leads).toFixed(2)) : 0;
  const roi = spend > 0 ? Number((((revenue - spend) / spend) * 100).toFixed(2)) : 0;

  return {
    ...campaign,
    metrics: {
      conversionRate,
      costPerLead,
      roi,
    },
  };
};

// GET /api/campaigns
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = (req.query.search as string) || '';
      const type = (req.query.type as string) || '';
      const status = (req.query.status as string) || '';
      const channel = (req.query.channel as string) || '';
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      const filter: any = {};

      if (type && type !== 'All') {
        filter.type = type;
      }
      if (status && status !== 'All') {
        filter.status = status;
      }
      if (channel && channel !== 'All') {
        filter.channel = channel;
      }

      if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { name: regex },
          { campaignId: regex },
          { trackingCode: regex },
          { objective: regex },
          { targetAudience: regex },
        ];
      }

      const total = await Campaign.countDocuments(filter);
      const rawCampaigns = await Campaign.find(filter)
        .populate('owner', 'name email role')
        .populate('createdBy', 'name email role')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const campaigns = rawCampaigns.map(computeCampaignMetrics);

      // Summary KPIs
      const allCampaigns = await Campaign.find().lean();
      const totalBudget = allCampaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
      const totalSpend = allCampaigns.reduce((acc, c) => acc + (c.actualSpend || 0), 0);
      const totalLeads = allCampaigns.reduce((acc, c) => acc + (c.leadsGenerated || 0), 0);
      const totalConversions = allCampaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);
      const totalRevenue = allCampaigns.reduce((acc, c) => acc + (c.revenueGenerated || 0), 0);
      const activeCount = allCampaigns.filter((c) => c.status === 'Active').length;

      const overallConversionRate = totalLeads > 0 ? Number(((totalConversions / totalLeads) * 100).toFixed(2)) : 0;
      const overallRoi = totalSpend > 0 ? Number((((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(2)) : 0;

      res.json({
        success: true,
        data: campaigns,
        summary: {
          totalCampaigns: allCampaigns.length,
          activeCampaigns: activeCount,
          totalBudget,
          totalSpend,
          totalLeads,
          totalConversions,
          totalRevenue,
          overallConversionRate,
          overallRoi,
        },
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

// GET /api/campaigns/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawCampaign = await Campaign.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('createdBy', 'name email role')
      .lean();

    if (!rawCampaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    const campaign = computeCampaignMetrics(rawCampaign);

    // Find associated leads matching this campaign trackingCode or source
    const associatedLeads = await Lead.find({
      $or: [
        { requirements: new RegExp(campaign.campaignId, 'i') },
        { notes: new RegExp(campaign.campaignId, 'i') },
        { source: 'Marketing campaign' },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ success: true, data: campaign, associatedLeads });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/campaigns
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Campaign name is required'),
    body('type').notEmpty().withMessage('Campaign type is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        type,
        channel,
        targetAudience,
        objective,
        status,
        startDate,
        endDate,
        budget,
        actualSpend,
        revenueGenerated,
        trackingCode,
        owner,
        description,
        notes,
      } = req.body;

      const campaign = new Campaign({
        name,
        type,
        channel: channel || 'Email',
        targetAudience: targetAudience || '',
        objective: objective || 'Lead Generation',
        status: status || 'Draft',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budget: Number(budget) || 0,
        actualSpend: Number(actualSpend) || 0,
        revenueGenerated: Number(revenueGenerated) || 0,
        trackingCode: trackingCode || '',
        owner: owner || req.user?.userId || null,
        createdBy: req.user?.userId || null,
        description: description || '',
        notes: notes || '',
      });

      await campaign.save();
      const populated = await Campaign.findById(campaign._id)
        .populate('owner', 'name email role')
        .populate('createdBy', 'name email role')
        .lean();

      res.status(201).json({ success: true, data: computeCampaignMetrics(populated) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
);

// POST /api/campaigns/:id/duplicate
router.post('/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Campaign.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Source campaign not found' });
      return;
    }

    const duplicate = new Campaign({
      name: `${existing.name} (Copy)`,
      type: existing.type,
      channel: existing.channel,
      targetAudience: existing.targetAudience,
      objective: existing.objective,
      status: 'Draft',
      budget: existing.budget,
      actualSpend: 0,
      leadsGenerated: 0,
      conversions: 0,
      revenueGenerated: 0,
      owner: existing.owner,
      createdBy: req.user?.userId,
      description: existing.description,
      notes: existing.notes,
    });

    await duplicate.save();
    const populated = await Campaign.findById(duplicate._id)
      .populate('owner', 'name email role')
      .populate('createdBy', 'name email role')
      .lean();

    res.status(201).json({ success: true, data: computeCampaignMetrics(populated) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// PATCH /api/campaigns/:id
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email role')
      .populate('createdBy', 'name email role')
      .lean();

    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: computeCampaignMetrics(campaign) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;
