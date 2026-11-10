import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { User } from '../models/User';

const router = Router();
router.use(authenticate);

// GET /api/users
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/users (SUPERADMIN only)
router.post(
  '/',
  requireRole('SUPERADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['SUPERADMIN', 'ADMIN', 'SALES_REP']),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await User.findOne({ email: req.body.email });
      if (existing) {
        res.status(400).json({ success: false, message: 'User with this email already exists' });
        return;
      }
      const user = new User(req.body);
      await user.save();
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
);

// PATCH /api/users/:id (SUPERADMIN only)
router.patch('/:id', requireRole('SUPERADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData = { ...req.body };
    delete updateData.password; // Do not directly patch plain password here

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// DELETE /api/users/:id (SUPERADMIN only)
router.delete('/:id', requireRole('SUPERADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.userId === req.params.id) {
      res.status(400).json({ success: false, message: 'Cannot delete yourself' });
      return;
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;

