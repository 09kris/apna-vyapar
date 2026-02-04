import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import ShopOwner from '../models/ShopOwner';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

interface RegisterRequest extends Request {
  body: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    password: string;
    userType: 'SHOP_OWNER' | 'EMPLOYEE' | 'CUSTOMER' | 'ADMIN';
    businessName?: string;
    businessEmail?: string;
    businessPhone?: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

// Generate JWT tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d',
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', {
    expiresIn: '30d',
  });

  return { accessToken, refreshToken };
};

// Register User
export const registerUser = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const { firstName, lastName, email, phoneNumber, password, userType, businessName, businessEmail, businessPhone } =
    req.body;

  // Validation
  if (!firstName || !lastName || !email || !password || !userType) {
    throw new ApiError(400, 'Missing required fields: firstName, lastName, email, password, userType');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  if (phoneNumber) {
    const existingPhone = await User.findOne({ where: { phoneNumber } });
    if (existingPhone) {
      throw new ApiError(409, 'Phone number already registered');
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    phoneNumber,
    passwordHash,
    userType,
    emailVerified: false,
  });

  // If SHOP_OWNER, create ShopOwner profile
  if (userType === 'SHOP_OWNER') {
    if (!businessName) {
      throw new ApiError(400, 'Business name is required for shop owners');
    }

    await ShopOwner.create({
      userId: user.userId,
      businessName,
      businessEmail: businessEmail || email,
      businessPhone: businessPhone || phoneNumber,
      isVerified: false,
      isSubscriptionActive: false,
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.userId);

  // Update last login
  await user.update({ lastLogin: new Date() });

  return res.status(201).json(
    new ApiResponse(201, {
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
      accessToken,
      refreshToken,
    }, 'User registered successfully'),
  );
});

// Login User
export const loginUser = asyncHandler(async (req: LoginRequest, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }
console.log(email,password);

  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(403, 'User account is inactive');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.userId);

  // Update last login
  await user.update({ lastLogin: new Date() });

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
      accessToken,
      refreshToken,
    }, 'Login successful'),
  );
});

// Refresh Token
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    return res.status(200).json(
      new ApiResponse(200, {
        accessToken,
        refreshToken: newRefreshToken,
      }, 'Token refreshed successfully'),
    );
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
});

// Logout User
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
});

// Get Current User
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    throw new ApiError(401, 'Not authenticated');
  }

  const userData = await User.findByPk(user.userId);

  if (!userData) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, {
      userId: userData.userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType,
      profileImage: userData.profileImage,
    }, 'User data retrieved successfully'),
  );
});

// Change Password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    throw new ApiError(401, 'Not authenticated');
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'Old password and new password are required');
  }

  const userData = await User.findByPk(user.userId);

  if (!userData) {
    throw new ApiError(404, 'User not found');
  }

  // Verify old password
  const isPasswordValid = await bcrypt.compare(oldPassword, userData.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Old password is incorrect');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update password
  await userData.update({ passwordHash });

  return res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});
