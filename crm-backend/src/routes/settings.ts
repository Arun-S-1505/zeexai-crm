import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { CRMSetting } from '../models/CRMSetting';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();
router.use(authenticate);

// Default General Settings
const defaultGeneralSettings = {
  organizationName: 'ZEE X AI Systems Pvt Ltd',
  contactEmail: 'contact@zeexai.com',
  contactPhone: '+91 (044) 4892-0100',
  address: 'Level 4, TIDEL Park, Tharamani, Chennai, TN 600113',
  website: 'https://zeexai.com',
  defaultCurrency: 'INR (₹)',
  timeZone: 'Asia/Kolkata (IST)',
  dateFormat: 'DD/MM/YYYY',
};

// GET /api/settings/general
router.get('/general', async (_req: Request, res: Response): Promise<void> => {
  try {
    const setting = await CRMSetting.findOne({ key: 'general_config' }).lean();
    res.json({
      success: true,
      data: setting ? setting.value : defaultGeneralSettings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// PUT /api/settings/general
router.put('/general', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?._id;
    const userName = (req as any).user?.name || 'Administrator';
    const userEmail = (req as any).user?.email || 'admin@zeexai.com';

    let setting = await CRMSetting.findOne({ key: 'general_config' });
    if (!setting) {
      setting = new CRMSetting({
        key: 'general_config',
        category: 'general',
        value: req.body,
        updatedBy: userId,
      });
    } else {
      setting.value = { ...setting.value, ...req.body };
      setting.updatedBy = userId;
    }
    await setting.save();

    // Log to Audit Log
    await AuditLog.create({
      user: userId,
      userName,
      userEmail,
      action: 'UPDATE_GENERAL_SETTINGS',
      module: 'Settings',
      details: 'Updated organization profile and regional configurations',
    });

    res.json({ success: true, data: setting.value, message: 'Settings saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update settings' });
  }
});

// GET /api/settings/users — User Management listing
router.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/settings/users — Create new user
router.post(
  '/users',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['SUPERADMIN', 'ADMIN', 'INTERN', 'SALES_REP']),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(400).json({ success: false, message: 'A user with this email already exists' });
        return;
      }

      const user = new User({
        name,
        email,
        password,
        role: role || 'INTERN',
        isActive: true,
      });
      await user.save();

      const userObj = user.toJSON();

      res.status(201).json({ success: true, data: userObj, message: 'User created successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
    }
  }
);

// PATCH /api/settings/users/:id/role — Change role
router.patch('/users/:id/role', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.role = role;
    await user.save();

    res.json({ success: true, data: user.toJSON(), message: `Role updated to ${role}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update role' });
  }
});

// PATCH /api/settings/users/:id/status — Activate / deactivate user
router.patch('/users/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.isActive = Boolean(isActive);
    await user.save();

    res.json({
      success: true,
      data: user.toJSON(),
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update user status' });
  }
});

// POST /api/settings/users/:id/reset-password — Reset password
router.post(
  '/users/:id/reset-password',
  [body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'), validateRequest],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { newPassword } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
    }
  }
);

// GET /api/settings/integrations — Integration status healthcheck
router.get('/integrations', async (_req: Request, res: Response): Promise<void> => {
  try {
    const hasIntegrationKey = Boolean(process.env.INTEGRATION_API_KEY);
    const hasJwtSecret = Boolean(process.env.JWT_SECRET);
    const hasAtlas = Boolean(process.env.MONGODB_URI);

    res.json({
      success: true,
      integrations: [
        {
          name: 'Public Website Lead & Brochure Intake API',
          status: hasIntegrationKey ? 'Active & Connected' : 'Missing Configuration',
          color: hasIntegrationKey ? 'green' : 'red',
          endpoint: '/api/intake/website-contact & /api/intake/brochure-download',
          protection: 'X-Integration-Key Header & IP Rate Limiter',
        },
        {
          name: 'MongoDB Atlas Dedicated Database',
          status: hasAtlas ? 'Connected (zeexai_crm)' : 'Disconnected',
          color: hasAtlas ? 'green' : 'red',
          endpoint: 'cluster0.fhdfwnf.mongodb.net',
          protection: 'TLS SCRAM-SHA-256 Authentication',
        },
        {
          name: 'JWT Session & Token Authority',
          status: hasJwtSecret ? 'Configured & Active' : 'Not Set',
          color: hasJwtSecret ? 'green' : 'red',
          endpoint: '/api/auth/login, /api/auth/refresh',
          protection: 'HMAC SHA-256 Signatures',
        },
        {
          name: 'Transactional Email Dispatch (SMTP / SendGrid)',
          status: 'Configuration Area Available (Ready to Connect)',
          color: 'amber',
          endpoint: 'smtp.sendgrid.net:587',
          protection: 'SSL / TLS Auth',
        },
        {
          name: 'WhatsApp Business API Gateway',
          status: 'Configuration Area Available (Ready to Connect)',
          color: 'amber',
          endpoint: 'graph.facebook.com/v19.0',
          protection: 'Bearer Access Token',
        },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/settings/audit-logs — System Audit Trail
router.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const module = (req.query.module as string) || '';
    const search = (req.query.search as string) || '';

    const filter: any = {};
    if (module && module !== 'All') filter.module = module;
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ action: regex }, { userName: regex }, { userEmail: regex }, { details: regex }];
    }

    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(100).lean();
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;

