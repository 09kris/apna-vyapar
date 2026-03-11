import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import ShopOwner from '../models/ShopOwner';
import Shop from '../models/Shop';
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

// Register User - Part 1: User Details Only
export const registerUser = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const { firstName, lastName, email, phoneNumber, password, userType } = req.body;

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

  // Create user (Part 1 - User details only)
  // ShopOwner profile will be created separately in Part 2
  const user = await User.create({
    firstName,
    lastName,
    email,
    phoneNumber,
    passwordHash,
    userType,
    emailVerified: false,
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.userId);

  // Update last login
  await user.update({ lastLogin: new Date() });

  // Check if user needs to complete shop owner profile
  const needsShopOwnerProfile = userType === 'SHOP_OWNER';

  return res.status(201).json(
    new ApiResponse(201, {
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
      needsShopOwnerProfile,
      accessToken,
      refreshToken,
    }, 'User registered successfully. Please complete your shop profile.'),
  );
});

// Complete Shop Owner Profile - Part 2: Business Details
export const completeShopOwnerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const {
    businessName,
    businessType,
    businessRegistrationNumber,
    taxIdentificationNumber,
    businessAddress,
    businessCity,
    businessState,
    businessZipCode,
    businessPhone,
    businessEmail,
    businessWebsite,
    businessLogo,
    bankAccountHolderName,
    bankAccountNumber,
    bankBranchCode,
    bankIfscCode,
  } = req.body;

  // Validation
  if (!businessName) {
    throw new ApiError(400, 'Business name is required');
  }

  // Find the user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if user is a SHOP_OWNER
  if (user.userType !== 'SHOP_OWNER') {
    throw new ApiError(403, 'Only shop owners can complete shop profile');
  }

  // Check if shop owner profile already exists
  const existingShopOwner = await ShopOwner.findOne({ where: { userId } });
  if (existingShopOwner) {
    throw new ApiError(409, 'Shop owner profile already exists');
  }

  // Create ShopOwner profile (Part 2 - Business details)
  const shopOwner = await ShopOwner.create({
    userId,
    businessName,
    businessType,
    businessRegistrationNumber,
    taxIdentificationNumber,
    businessAddress,
    businessCity,
    businessState,
    businessZipCode,
    businessPhone,
    businessEmail,
    businessWebsite,
    businessLogo,
    bankAccountHolderName,
    bankAccountNumber,
    bankBranchCode,
    bankIfscCode,
    isVerified: false,
    isSubscriptionActive: false,
  });

  // Create a Shop automatically using the business details
  const shop = await Shop.create({
    ownerId: shopOwner.ownerId,
    shopName: businessName,
    shopType: businessType || 'RETAIL',
    phoneNumber: businessPhone || '',
    email: businessEmail || user.email,
    address: businessAddress || '',
    city: businessCity || '',
    state: businessState || '',
    zipCode: businessZipCode || '',
    country: 'India', // Default country
    isActive: true,
    isVerified: false,
  });

  return res.status(201).json(
    new ApiResponse(201, {
      shopOwner: {
        ownerId: shopOwner.ownerId,
        userId: shopOwner.userId,
        businessName: shopOwner.businessName,
        businessType: shopOwner.businessType,
        isVerified: shopOwner.isVerified,
      },
      shop: {
        shopId: shop.shopId,
        shopName: shop.shopName,
        shopType: shop.shopType,
      },
    }, 'Shop owner profile and shop created successfully'),
  );
});

// Login User
export const loginUser = asyncHandler(async (req: LoginRequest, res: Response) => {
  const { email, password } = req.body;
  
  console.log('📝 Login attempt for:', email);
  console.log('📝 Request body:', req.body);
  console.log('📝 Headers:', req.headers);

  // Validation
  if (!email || !password) {
    console.log('❌ Validation failed: Missing email or password');
    throw new ApiError(400, 'Email and password are required');
  }

  // Find user
  const user = await User.findOne({ where: { email } });
  console.log('👤 User found:', user ? 'Yes' : 'No');
  
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(403, 'User account is inactive');
  }

  // Verify password
  console.log('🔐 Verifying password...');
  console.log('🔐 Stored hash length:', user.passwordHash.length);
  console.log('🔐 Stored hash starts with:', user.passwordHash.substring(0, 10));
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  console.log('🔐 Password valid:', isPasswordValid);
  
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.userId);

  // Update last login
  await user.update({ lastLogin: new Date() });

  // Get shop IDs if user is a shop owner
  let shops: any[] = [];
  let employeeData: any = null;
  if (user.userType === 'SHOP_OWNER') {
    const shopOwner = await ShopOwner.findOne({ where: { userId: user.userId } });
    if (shopOwner) {
      const userShops = await Shop.findAll({ where: { ownerId: shopOwner.ownerId } });
      shops = userShops.map(shop => ({
        shopId: shop.shopId,
        shopName: shop.shopName,
        shopType: shop.shopType,
        isActive: shop.isActive
      }));
    }
  } else if (user.userType === 'EMPLOYEE') {
    const Employee = (await import('../models/Employee')).default;
    const employeeRecords = await Employee.findAll({ where: { userId: user.userId, isActive: true } });
    if (employeeRecords.length > 0) {
      const shopIds = employeeRecords.map(emp => emp.shopId);
      const userShops = await Shop.findAll({ where: { shopId: shopIds } });
      shops = userShops.map(shop => ({
        shopId: shop.shopId,
        shopName: shop.shopName,
        shopType: shop.shopType,
        isActive: shop.isActive
      }));
      
      // Get the first active employee record
      const employeeRecord = employeeRecords[0];
      
      // Import DEFAULT_PERMISSIONS for fallback
      const { DEFAULT_PERMISSIONS } = await import('../models/Employee');
      
      // Use custom permissions if set, otherwise use default based on staffRole
      const permissions = employeeRecord.permissions || DEFAULT_PERMISSIONS[employeeRecord.staffRole] || DEFAULT_PERMISSIONS['Staff'];
      
      employeeData = {
        employeeId: employeeRecord.employeeId,
        designation: employeeRecord.designation,
        employeeType: employeeRecord.employeeType,
        staffRole: employeeRecord.staffRole,
        permissions: permissions
      };
    }
  }

  console.log('✅ Login successful for:', email);

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        ...(employeeData && { 
          designation: employeeData.designation, 
          employeeType: employeeData.employeeType,
          staffRole: employeeData.staffRole
        })
      },
      shops,
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
