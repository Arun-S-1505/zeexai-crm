import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { BrochureDownload } from '../models/BrochureDownload';
import { Lead } from '../models/Lead';

const router = Router();
router.use(authenticate);

// GET /api/brochure-downloads
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
      const brochureType = (req.query.brochureType as string) || '';
      const status = (req.query.status as string) || '';
      const source = (req.query.source as string) || '';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      const filter: any = {};

      if (brochureType && brochureType !== 'All') {
        filter.brochureType = brochureType;
      }
      if (status && status !== 'All') {
        filter.status = status;
      }
      if (source && source !== 'All') {
        filter.source = source;
      }
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { name: regex },
          { email: regex },
          { company: regex },
          { phone: regex },
          { downloadId: regex },
        ];
      }

      const total = await BrochureDownload.countDocuments(filter);
      const downloads = await BrochureDownload.find(filter)
        .populate('relatedLead', 'leadId firstName lastName company status email')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Overall metrics summary
      const totalAll = await BrochureDownload.countDocuments();
      const newCount = await BrochureDownload.countDocuments({ status: 'New' });
      const convertedCount = await BrochureDownload.countDocuments({ status: 'Converted' });
      const repeatCount = await BrochureDownload.countDocuments({ isRepeat: true });

      res.json({
        success: true,
        data: downloads,
        metrics: {
          total: totalAll,
          new: newCount,
          converted: convertedCount,
          repeat: repeatCount,
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

// GET /api/brochure-downloads/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await BrochureDownload.findById(req.params.id).populate('relatedLead');
    if (!item) {
      res.status(404).json({ success: false, message: 'Brochure download record not found' });
      return;
    }

    // Get all previous downloads by same email for repeat history
    const history = await BrochureDownload.find({ email: item.email, _id: { $ne: item._id } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: item, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/brochure-downloads
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Contact name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, company, phone, brochureType, source, notes, createLead } = req.body;

      // Check for repeat download
      const existingCount = await BrochureDownload.countDocuments({ email });
      const isRepeat = existingCount > 0;

      // Try finding or associating existing lead
      let relatedLeadId = req.body.relatedLead;
      if (!relatedLeadId) {
        const lead = await Lead.findOne({ email });
        if (lead) {
          relatedLeadId = lead._id;
        } else if (createLead) {
          const nameParts = name.trim().split(' ');
          const newLead = new Lead({
            firstName: nameParts[0] || 'Unknown',
            lastName: nameParts.slice(1).join(' ') || 'Lead',
            company: company || 'Not specified',
            email,
            phone: phone || '',
            interestedProduct: 'Z-Factory',
            source: 'Brochure download',
            status: 'New',
            priority: 'Medium',
            requirements: `Downloaded brochure: ${brochureType || 'Z-Factory Overview'}`,
          });
          await newLead.save();
          relatedLeadId = newLead._id;
        }
      }

      const download = new BrochureDownload({
        name,
        email,
        company: company || '',
        phone: phone || '',
        brochureType: brochureType || 'Z-Factory Overview',
        source: source || 'Manual Entry',
        notes: notes || '',
        relatedLead: relatedLeadId || null,
        isRepeat,
        downloadCount: existingCount + 1,
      });

      await download.save();
      const populated = await BrochureDownload.findById(download._id).populate('relatedLead');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
);

// PATCH /api/brochure-downloads/:id
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await BrochureDownload.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('relatedLead');

    if (!item) {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// DELETE /api/brochure-downloads/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await BrochureDownload.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }
    res.json({ success: true, message: 'Record deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;
