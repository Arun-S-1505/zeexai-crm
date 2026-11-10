import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { User } from '../models/User';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

const generateTokens = (user: { _id: any; email: string; role: string }) => {
  const accessSecret = process.env.JWT_SECRET || 'fallback_secret';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  const accessExpires = process.env.JWT_ACCESS_EXPIRES || '15m';

  const accessToken = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    accessSecret,
    { expiresIn: (accessExpires as any) || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    refreshSecret,
    { expiresIn: '7d' as any }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validateRequest,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, role } = req.body;
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      // If a specific role was selected on the login page, verify it
      if (role) {
        const roleAllowed =
          user.role === role ||
          (user.role === 'SUPERADMIN' && role === 'ADMIN');
        if (!roleAllowed) {
          res.status(403).json({
            success: false,
            message: `Access denied. This account has role ${user.role}, but you selected ${role}.`,
          });
          return;
        }
      }

      user.lastLogin = new Date();
      await user.save();

      const { accessToken, refreshToken } = generateTokens(user);

      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('crm_refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.crm_refresh_token;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token not found' });
      return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await User.findOne({ _id: decoded.userId, isActive: true });
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }

    const tokens = generateTokens(user);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('crm_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken: tokens.accessToken,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('crm_refresh_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;

