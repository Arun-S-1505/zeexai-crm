import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { Acknowledgement } from '../models/Acknowledgement';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();
router.use(authenticate);

// Default content templates based on acknowledgement type
export const getAcknowledgementTemplate = (type: string, contactName: string, company: string, refNum: string) => {
  const companyStr = company ? ` at ${company}` : '';
  switch (type) {
    case 'Enquiry Received':
      return `Dear ${contactName},\n\nThank you for reaching out to ZEE X AI. We have safely logged your enterprise enquiry (Ref: ${refNum}). Our AI systems engineering team is reviewing your requirements and will follow up within one business day.\n\nBest regards,\nZEE X AI Operations Team`;
    case 'Lead Received':
      return `Dear ${contactName},\n\nThis confirms receipt and onboarding of your organization${companyStr} into the ZEE X AI pipeline under tracking reference ${refNum}.\n\nSincerely,\nZEE X AI Client Relations`;
    case 'Brochure Request':
      return `Dear ${contactName},\n\nWe acknowledge your solution brochure download request (Ref: ${refNum}). Detailed technical specifications and industrial deployment guides have been linked to your profile.\n\nWarm regards,\nZEE X AI Product Team`;
    case 'Quotation Received':
      return `Dear ${contactName},\n\nWe acknowledge receipt of your formal commercial quotation inquiry (Ref: ${refNum}). Our technical estimating team is preparing the itemized scope of work.\n\nSincerely,\nZEE X AI Sales & Commercial`;
    case 'Quotation Acceptance':
      return `Dear ${contactName},\n\nWe formally confirm and acknowledge the acceptance of quotation ${refNum}${companyStr}. Deployment scheduling and milestone execution will commence per terms of agreement.\n\nBest regards,\nZEE X AI Executive Office`;
    case 'Document Received':
      return `Dear ${contactName},\n\nThis constitutes formal acknowledgement of the confidential documents and site specifications received under reference ${refNum}.\n\nSincerely,\nZEE X AI Compliance`;
    case 'Meeting Confirmation':
      return `Dear ${contactName},\n\nWe confirm the scheduling of our solution demonstration and architecture discovery session (Ref: ${refNum}). Calendar invitation with secure session link has been transmitted.\n\nWarm regards,\nZEE X AI Operations`;
    default:
      return `Dear ${contactName},\n\nThis document serves as formal acknowledgement regarding communication reference ${refNum}.\n\nBest regards,\nZEE X AI`;
  }
};

// GET /api/acknowledgements — Listing with filters, search, metrics, pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const search = (req.query.search as string) || '';
    const type = (req.query.type as string) || '';
    const status = (req.query.status as string) || '';
    const assignedTo = (req.query.assignedTo as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter: any = {};

    if (type && type !== 'All') {
      filter.type = type;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (assignedTo && assignedTo !== 'All') {
      filter.assignedTo = assignedTo;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { acknowledgementId: regex },
        { referenceNumber: regex },
        { contactName: regex },
        { company: regex },
        { email: regex },
        { subject: regex },
      ];
    }

    const total = await Acknowledgement.countDocuments(filter);
    const acknowledgements = await Acknowledgement.find(filter)
      .populate('relatedLead', 'leadId firstName lastName company email phone')
      .populate('relatedQuotation', 'quotationNumber title grandTotal')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Summary Metrics
    const allRecords = await Acknowledgement.find({}, { status: 1, createdAt: 1 }).lean();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const metrics = {
      total: allRecords.length,
      pending: allRecords.filter((a) => ['Draft', 'Pending Approval'].includes(a.status)).length,
      sent: allRecords.filter((a) => a.status === 'Sent').length,
      confirmed: allRecords.filter((a) => a.status === 'Acknowledged').length,
      overdue: allRecords.filter(
        (a) =>
          a.status === 'Expired' ||
          (['Draft', 'Pending Approval'].includes(a.status) && new Date(a.createdAt) < sevenDaysAgo)
      ).length,
    };

    res.json({
      success: true,
      data: acknowledgements,
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

// GET /api/acknowledgements/:id — Details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Acknowledgement.findById(req.params.id)
      .populate('relatedLead')
      .populate('relatedQuotation')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('history.changedBy', 'name email role');

    if (!item) {
      res.status(404).json({ success: false, message: 'Acknowledgement record not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/acknowledgements — Create acknowledgement
router.post(
  '/',
  [
    body('contactName').trim().notEmpty().withMessage('Contact name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        referenceNumber,
        contactName,
        company,
        email,
        phone,
        relatedLead,
        relatedQuotation,
        type,
        subject,
        content,
        assignedTo,
        notes,
        status,
      } = req.body;

      const userId = (req as any).user?.userId || (req as any).user?._id;
      const chosenType = type || 'Enquiry Received';
      const refNum = referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

      const finalContent =
        content && content.trim()
          ? content
          : getAcknowledgementTemplate(chosenType, contactName, company || '', refNum);

      const ack = new Acknowledgement({
        referenceNumber: refNum,
        contactName,
        company: company || '',
        email,
        phone: phone || '',
        relatedLead: relatedLead || null,
        relatedQuotation: relatedQuotation || null,
        type: chosenType,
        subject,
        content: finalContent,
        status: status || 'Draft',
        assignedTo: assignedTo || userId || null,
        createdBy: userId || null,
        notes: notes || '',
        history: [
          {
            status: status || 'Draft',
            changedAt: new Date(),
            changedBy: userId || null,
            note: 'Acknowledgement generated',
          },
        ],
      });

      await ack.save();

      const populated = await Acknowledgement.findById(ack._id)
        .populate('relatedLead', 'leadId firstName lastName company email phone')
        .populate('relatedQuotation', 'quotationNumber title')
        .populate('assignedTo', 'name email role');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create acknowledgement' });
    }
  }
);

// PUT /api/acknowledgements/:id — Update
router.put(
  '/:id',
  [
    body('contactName').trim().notEmpty().withMessage('Contact name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const ack = await Acknowledgement.findById(req.params.id);
      if (!ack) {
        res.status(404).json({ success: false, message: 'Acknowledgement not found' });
        return;
      }

      Object.assign(ack, req.body);
      await ack.save();

      const updated = await Acknowledgement.findById(ack._id)
        .populate('relatedLead', 'leadId firstName lastName company email phone')
        .populate('relatedQuotation', 'quotationNumber title')
        .populate('assignedTo', 'name email role');

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to update record' });
    }
  }
);

// PATCH /api/acknowledgements/:id/status — Status update & confirmation tracking
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, note, responseDate } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?._id;

    const ack = await Acknowledgement.findById(req.params.id);
    if (!ack) {
      res.status(404).json({ success: false, message: 'Acknowledgement not found' });
      return;
    }

    if (status) {
      ack.status = status;
      if (status === 'Sent' && !ack.sentDate) {
        ack.sentDate = new Date();
      }
      if (status === 'Acknowledged') {
        ack.responseDate = responseDate ? new Date(responseDate) : new Date();
      }

      ack.history.push({
        status,
        changedAt: new Date(),
        changedBy: userId || null,
        note: note || `Acknowledgement marked as ${status}`,
      });
    }

    await ack.save();

    const updated = await Acknowledgement.findById(ack._id)
      .populate('relatedLead', 'leadId firstName lastName company email phone')
      .populate('assignedTo', 'name email role');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
  }
});

// DELETE /api/acknowledgements/:id — Delete
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ack = await Acknowledgement.findById(req.params.id);
    if (!ack) {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }

    await Acknowledgement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Acknowledgement removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete' });
  }
});

export default router;
