import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { integrationAuth } from '../middleware/integrationAuth';
import { validateRequest } from '../middleware/validate';
import { Lead } from '../models/Lead';
import { BrochureDownload } from '../models/BrochureDownload';

const router = Router();

// Rate limit: max 30 submissions per 15 minutes
const intakeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many submissions from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/intake/website-contact
// Server-to-server endpoint secured with X-Integration-Key header
router.post(
  '/website-contact',
  intakeLimiter,
  integrationAuth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('phone').optional().trim(),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, message } = req.body;

      // Split name into first and last
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Lead';

      // Check for recent duplicate submission from same email within last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await Lead.findOne({
        email,
        createdAt: { $gte: oneDayAgo },
      });

      const isDuplicate = !!existing;

      const lead = new Lead({
        firstName,
        lastName,
        company: req.body.company || 'Website Inquiry',
        email,
        phone: phone || '',
        interestedProduct: req.body.interestedProduct || 'Z-Factory',
        source: 'Contact form',
        status: 'New',
        priority: isDuplicate ? 'Low' : 'High',
        requirements: message,
        notes: `Submitted via website contact form at ${new Date().toISOString()}`,
        isDuplicate,
      });

      await lead.save();

      res.status(201).json({
        success: true,
        message: 'Lead created successfully from website contact form',
        leadId: lead.leadId,
        id: lead._id,
        isDuplicate,
      });
    } catch (error: any) {
      console.error('Intake error:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
);

// POST /api/intake/brochure-download
// Server-to-server endpoint for public brochure download forms
router.post(
  '/brochure-download',
  intakeLimiter,
  integrationAuth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, company, brochureType, source } = req.body;

      const existingCount = await BrochureDownload.countDocuments({ email });
      const isRepeat = existingCount > 0;

      // Check if lead already exists or create new one
      let lead = await Lead.findOne({ email });
      if (!lead) {
        const nameParts = name.trim().split(' ');
        lead = new Lead({
          firstName: nameParts[0] || 'Unknown',
          lastName: nameParts.slice(1).join(' ') || 'Lead',
          company: company || 'Website Visitor',
          email,
          phone: phone || '',
          interestedProduct: brochureType?.includes('Drone')
            ? 'Z-Drone'
            : brochureType?.includes('Tracs')
            ? 'Z-Tracs'
            : brochureType?.includes('Market')
            ? 'Z-Market'
            : 'Z-Factory',
          source: 'Brochure download',
          status: 'New',
          priority: isRepeat ? 'High' : 'Medium',
          requirements: `Downloaded ${brochureType || 'Whitepaper'} from website.`,
        });
        await lead.save();
      }

      const download = new BrochureDownload({
        name,
        email,
        phone: phone || '',
        company: company || '',
        brochureType: brochureType || 'Z-Factory Technical Whitepaper',
        source: source || 'Website Download',
        relatedLead: lead._id,
        isRepeat,
        downloadCount: existingCount + 1,
      });

      await download.save();

      res.status(201).json({
        success: true,
        message: 'Brochure download registered and lead synchronized',
        downloadId: download.downloadId,
        leadId: lead.leadId,
        isRepeat,
      });
    } catch (error: any) {
      console.error('Brochure intake error:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
);

export default router;

