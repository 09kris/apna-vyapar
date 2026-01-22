import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SuperAdmin } from '../models/SuperAdmin';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Super Admin Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password required', 400);
  }

  const admin = await SuperAdmin.findOne({ where: { email } });
  if (!admin) {
    throw new ApiError('Invalid credentials', 401);
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    throw new ApiError('Account locked. Try again later', 403);
  }

  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    admin.loginAttempts += 1;
    if (admin.loginAttempts >= 5) {
      admin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await admin.update({ loginAttempts: admin.loginAttempts, lockedUntil: admin.lockedUntil });
    
    throw new ApiError('Invalid credentials', 401);
  }

  await admin.update({ 
    loginAttempts: 0, 
    lockedUntil: undefined, 
    lastLogin: new Date() 
  });

  const token = jwt.sign(
    { adminId: admin.id, email: admin.email, role: admin.role },
    (process.env.JWT_SECRET || 'secret') as string,
    { expiresIn: process.env.JWT_EXPIRY || '24h' } as any
  );

  res.json({
    message: 'Login successful',
    token,
    admin: {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    }
  });
}));

// Get Super Admin Profile
router.get('/profile', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = (req as any).adminId;
  const admin = await SuperAdmin.findByPk(adminId, {
    attributes: { exclude: ['passwordHash'] }
  });

  if (!admin) {
    throw new ApiError('Admin not found', 404);
  }

  res.json(admin);
}));

// Super Admin Logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
