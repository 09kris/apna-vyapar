import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken } from '../middleware/auth';

const router: Router = express.Router();

// Register user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, phone, password, role } = req.body;

  if (!fullName || !email || !phone || !password) {
    throw new ApiError('Missing required fields', 400);
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError('Email already registered', 409);
  }

  const user = await User.create({
    fullName,
    email,
    phone,
    passwordHash: password,
    role: role || 'guest',
    isActive: true,
    isVerified: false,
    loginAttempts: 0
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    (process.env.JWT_SECRET || 'secret') as string,
    { expiresIn: process.env.JWT_EXPIRY || '24h' } as any
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
}));

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password required', 400);
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError('Invalid credentials', 401);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError('Account locked. Try again later', 403);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.update({ loginAttempts: user.loginAttempts, lockedUntil: user.lockedUntil });
    
    throw new ApiError('Invalid credentials', 401);
  }

  await user.update({ loginAttempts: 0, lockedUntil: undefined, lastLogin: new Date() });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    (process.env.JWT_SECRET || 'secret') as string,
    { expiresIn: process.env.JWT_EXPIRY || '24h' } as any
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
}));

// Get user profile
router.get('/profile', verifyToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['passwordHash'] }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  res.json(user);
}));

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
