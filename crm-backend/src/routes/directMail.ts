import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { DirectMail } from '../models/DirectMail';
import { Lead } from '../models/Lead';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();
router.use(authenticate);

// GET /api/direct-mail — List with filters, search, pagination, summary metrics
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const mailType = (req.query.mailType as string) || '';
    const assignedTo = (req.query.assignedTo as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter: any = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (mailType && mailType !== 'All') {
      filter.mailType = mailType;
    }
    if (assignedTo && assignedTo !== 'All') {
      filter.assignedTo = assignedTo;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { mailId: regex },
        { recipientName: regex },
        { companyName: regex },
        { addressLine1: regex },
        { city: regex },
        { postalCode: regex },
        { trackingNumber: regex },
      ];
    }

    const total = await DirectMail.countDocuments(filter);
    const mailRecords = await DirectMail.find(filter)
      .populate('relatedLead', 'leadId firstName lastName company email phone')
      .populate('relatedCampaign', 'campaignId name')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Summary Metrics
    const allRecords = await DirectMail.find({}, { status: 1 }).lean();
    const metrics = {
      total: allRecords.length,
      pending: allRecords.filter((m) => ['Draft', 'Pending Approval', 'Ready for Dispatch'].includes(m.status)).length,
      dispatched: allRecords.filter((m) => m.status === 'Dispatched').length,
      delivered: allRecords.filter((m) => m.status === 'Delivered').length,
      returned: allRecords.filter((m) => m.status === 'Returned').length,
    };

    res.json({
      success: true,
      data: mailRecords,
      metrics,
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

// GET /api/direct-mail/:id — Detail view
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await DirectMail.findById(req.params.id)
      .populate('relatedLead')
      .populate('relatedCampaign')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('statusHistory.changedBy', 'name email role');

    if (!item) {
      res.status(404).json({ success: false, message: 'Direct mail record not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/direct-mail — Create mail record
router.post(
  '/',
  [
    body('recipientName').trim().notEmpty().withMessage('Recipient name is required'),
    body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
    body('mailType').optional().trim(),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        recipientName,
        companyName,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        mailType,
        status,
        relatedLead,
        relatedCampaign,
        scheduledDate,
        assignedTo,
        notes,
      } = req.body;

      const userId = (req as any).user?.userId || (req as any).user?._id;

      const mail = new DirectMail({
        recipientName,
        companyName: companyName || '',
        addressLine1,
        addressLine2: addressLine2 || '',
        city,
        state,
        postalCode,
        country: country || 'India',
        mailType: mailType || 'Brochure',
        status: status || 'Draft',
        relatedLead: relatedLead || null,
        relatedCampaign: relatedCampaign || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        assignedTo: assignedTo || userId || null,
        createdBy: userId || null,
        notes: notes || '',
        statusHistory: [
          {
            status: status || 'Draft',
            changedAt: new Date(),
            changedBy: userId || null,
            note: 'Initial mail record created',
          },
        ],
      });

      await mail.save();

      const populated = await DirectMail.findById(mail._id)
        .populate('relatedLead', 'leadId firstName lastName company email phone')
        .populate('relatedCampaign', 'campaignId name')
        .populate('assignedTo', 'name email role');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create direct mail' });
    }
  }
);

// PUT /api/direct-mail/:id — Update record
router.put(
  '/:id',
  [
    body('recipientName').trim().notEmpty().withMessage('Recipient name is required'),
    body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const mail = await DirectMail.findById(req.params.id);
      if (!mail) {
        res.status(404).json({ success: false, message: 'Direct mail record not found' });
        return;
      }

      Object.assign(mail, req.body);
      await mail.save();

      const updated = await DirectMail.findById(mail._id)
        .populate('relatedLead', 'leadId firstName lastName company email phone')
        .populate('relatedCampaign', 'campaignId name')
        .populate('assignedTo', 'name email role');

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to update record' });
    }
  }
);

// PATCH /api/direct-mail/:id/status — Update dispatch / delivery status & tracking
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, trackingNumber, postalCarrier, dispatchDate, deliveryDate, note } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?._id;

    const mail = await DirectMail.findById(req.params.id);
    if (!mail) {
      res.status(404).json({ success: false, message: 'Direct mail record not found' });
      return;
    }

    if (status) mail.status = status;
    if (trackingNumber !== undefined) mail.trackingNumber = trackingNumber;
    if (postalCarrier !== undefined) mail.postalCarrier = postalCarrier;
    if (dispatchDate) mail.dispatchDate = new Date(dispatchDate);
    if (deliveryDate) mail.deliveryDate = new Date(deliveryDate);

    if (status) {
      mail.statusHistory.push({
        status,
        changedAt: new Date(),
        changedBy: userId || null,
        note: note || `Status changed to ${status}`,
      });
    }

    await mail.save();

    const updated = await DirectMail.findById(mail._id)
      .populate('relatedLead', 'leadId firstName lastName company email phone')
      .populate('assignedTo', 'name email role');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
  }
});

// DELETE /api/direct-mail/:id — Delete mail record
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const mail = await DirectMail.findById(req.params.id);
    if (!mail) {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }

    await DirectMail.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Direct mail record removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete' });
  }
});

export default router;

