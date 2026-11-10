import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { Quotation, IQuotationLineItem } from '../models/Quotation';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();
router.use(authenticate);

// Helper function to safely recompute financial totals server-side
export const computeQuotationTotals = (rawItems: any[] = []) => {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const lineItems: IQuotationLineItem[] = rawItems.map((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const discount = Math.min(100, Math.max(0, Number(item.discount) || 0));
    const taxRate = Math.min(100, Math.max(0, Number(item.taxRate) || 0));

    const itemBase = quantity * unitPrice;
    const discountAmount = itemBase * (discount / 100);
    const itemAfterDiscount = itemBase - discountAmount;
    const itemTax = itemAfterDiscount * (taxRate / 100);
    const lineTotal = Number((itemAfterDiscount + itemTax).toFixed(2));

    subtotal += itemBase;
    discountTotal += discountAmount;
    taxTotal += itemTax;

    return {
      name: item.name || 'Service / Product',
      description: item.description || '',
      quantity,
      unit: item.unit || 'Units',
      unitPrice,
      discount,
      taxRate,
      lineTotal,
    };
  });

  const grandTotal = Number((subtotal - discountTotal + taxTotal).toFixed(2));

  return {
    lineItems,
    subtotal: Number(subtotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    grandTotal,
  };
};

// GET /api/quotations — Listing with search, status filter, pagination, summary metrics
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const assignedTo = (req.query.assignedTo as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter: any = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (assignedTo && assignedTo !== 'All') {
      filter.assignedTo = assignedTo;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { quotationNumber: regex },
        { title: regex },
        { customerName: regex },
        { company: regex },
        { email: regex },
      ];
    }

    const total = await Quotation.countDocuments(filter);
    const quotations = await Quotation.find(filter)
      .populate('relatedLead', 'leadId firstName lastName company email phone')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Summary Metrics
    const allQuotes = await Quotation.find({}, { status: 1, grandTotal: 1 }).lean();
    const metrics = {
      total: allQuotes.length,
      pending: allQuotes.filter((q) => ['Draft', 'Pending Approval'].includes(q.status)).length,
      approved: allQuotes.filter((q) => q.status === 'Approved').length,
      accepted: allQuotes.filter((q) => q.status === 'Accepted').length,
      pipelineValue: allQuotes
        .filter((q) => !['Cancelled', 'Rejected'].includes(q.status))
        .reduce((sum, q) => sum + (q.grandTotal || 0), 0),
    };

    res.json({
      success: true,
      data: quotations,
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

// GET /api/quotations/:id — Detail view
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Quotation.findById(req.params.id)
      .populate('relatedLead')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('statusHistory.changedBy', 'name email role');

    if (!item) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/quotations — Create new quotation
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Quotation title is required'),
    body('customerName').trim().notEmpty().withMessage('Customer name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid customer email is required'),
    body('validUntil').notEmpty().withMessage('Validity date is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        customerName,
        company,
        email,
        phone,
        billingAddress,
        shippingAddress,
        relatedLead,
        validUntil,
        assignedTo,
        currency,
        lineItems: rawLineItems,
        paymentTerms,
        deliveryTerms,
        notes,
        termsAndConditions,
        status,
      } = req.body;

      const userId = (req as any).user?.userId || (req as any).user?._id;
      const computed = computeQuotationTotals(rawLineItems || []);

      const quotation = new Quotation({
        title,
        customerName,
        company: company || '',
        email,
        phone: phone || '',
        billingAddress: billingAddress || '',
        shippingAddress: shippingAddress || '',
        relatedLead: relatedLead || null,
        issueDate: new Date(),
        validUntil: new Date(validUntil),
        assignedTo: assignedTo || userId || null,
        createdBy: userId || null,
        currency: currency || 'INR',
        lineItems: computed.lineItems,
        subtotal: computed.subtotal,
        discountTotal: computed.discountTotal,
        taxTotal: computed.taxTotal,
        grandTotal: computed.grandTotal,
        paymentTerms: paymentTerms || undefined,
        deliveryTerms: deliveryTerms || undefined,
        notes: notes || '',
        termsAndConditions: termsAndConditions || undefined,
        status: status || 'Draft',
        statusHistory: [
          {
            status: status || 'Draft',
            changedAt: new Date(),
            changedBy: userId || null,
            note: 'Quotation created',
          },
        ],
      });

      await quotation.save();

      const populated = await Quotation.findById(quotation._id)
        .populate('relatedLead', 'leadId firstName lastName company email phone')
        .populate('assignedTo', 'name email role');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create quotation' });
    }
  }
);

// PUT /api/quotations/:id — Update quotation
router.put(
  '/:id',
  [
    body('title').trim().notEmpty().withMessage('Quotation title is required'),
    body('customerName').trim().notEmpty().withMessage('Customer name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid customer email is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const quote = await Quotation.findById(req.params.id);
      if (!quote) {
        res.status(404).json({ success: false, message: 'Quotation not found' });
        return;
      }

      if (req.body.lineItems) {
        const computed = computeQuotationTotals(req.body.lineItems);
        req.body.lineItems = computed.lineItems;
        req.body.subtotal = computed.subtotal;
        req.body.discountTotal = computed.discountTotal;
        req.body.taxTotal = computed.taxTotal;
        req.body.grandTotal = computed.grandTotal;
      }

      Object.assign(quote, req.body);
      await quote.save();

      const updated = await Quotation.findById(quote._id)
        .populate('relatedLead', 'leadId firstName lastName company email phone')
        .populate('assignedTo', 'name email role');

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to update quotation' });
    }
  }
);

// POST /api/quotations/:id/duplicate — Duplicate quotation
router.post('/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const original = await Quotation.findById(req.params.id).lean();
    if (!original) {
      res.status(404).json({ success: false, message: 'Source quotation not found' });
      return;
    }

    const userId = (req as any).user?.userId || (req as any).user?._id;
    const { _id, quotationNumber, createdAt, updatedAt, statusHistory, ...rest } = original as any;

    const clone = new Quotation({
      ...rest,
      title: `${rest.title} (Copy)`,
      status: 'Draft',
      createdBy: userId || null,
      issueDate: new Date(),
      statusHistory: [
        {
          status: 'Draft',
          changedAt: new Date(),
          changedBy: userId || null,
          note: `Duplicated from ${quotationNumber}`,
        },
      ],
    });

    await clone.save();

    const populated = await Quotation.findById(clone._id)
      .populate('relatedLead', 'leadId firstName lastName company email phone')
      .populate('assignedTo', 'name email role');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to duplicate quotation' });
  }
});

// PATCH /api/quotations/:id/status — Status transitions with audit history
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, note } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?._id;

    const quote = await Quotation.findById(req.params.id);
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    if (status) {
      quote.status = status;
      quote.statusHistory.push({
        status,
        changedAt: new Date(),
        changedBy: userId || null,
        note: note || `Status updated to ${status}`,
      });
    }

    await quote.save();

    const updated = await Quotation.findById(quote._id)
      .populate('relatedLead', 'leadId firstName lastName company email phone')
      .populate('assignedTo', 'name email role');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update quotation status' });
  }
});

// DELETE /api/quotations/:id — Delete quotation
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const quote = await Quotation.findById(req.params.id);
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quotation removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete quotation' });
  }
});

export default router;
