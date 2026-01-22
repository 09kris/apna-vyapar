import express, { Router, Request, Response } from 'express';
import { Shop } from '../models/Shop';
import { Location } from '../models/Location';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, requireRole, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Create shop
router.post('/', verifyToken, requireRole(['owner', 'admin']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const {
    shopName, shopType, category, address, city, state, pincode,
    latitude, longitude, phone, alternatePhone, email, gstNumber,
    panNumber, openingTime, closingTime, description
  } = req.body;

  if (!shopName || !category || !address || !city || !state || !pincode) {
    throw new ApiError('Missing required shop details', 400);
  }

  const existingShop = await Shop.findOne({ where: { ownerId: userId } });
  if (existingShop) {
    throw new ApiError('User already has a shop', 409);
  }

  const referralCode = generateReferralCode();
  const userIdNum = parseInt(userId as string);

  const shop = await Shop.create({
    shopName, ownerId: userIdNum, referralCode,
    shopType: shopType || 'retail', category, address, city, state, pincode,
    latitude, longitude, phone, alternatePhone, email,
    gstNumber, panNumber, openingTime, closingTime, description,
    isActive: true, isVerified: false, totalOrders: 0, totalRevenue: 0,
    kycStatus: 'pending', isBlocked: false
  });

  await Location.create({
    shopId: shop.id, city, area: category, pincode,
    latitude, longitude, isPrimary: true
  });

  res.status(201).json({
    message: 'Shop created successfully',
    shop: {
      id: shop.id, shopName: shop.shopName, referralCode: shop.referralCode,
      category: shop.category, city: shop.city, isActive: shop.isActive
    }
  });
}));

// Get all shops
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { city, category, page = '1', limit = '10' } = req.query;
  const filter: any = { isActive: true };
  
  if (city) filter.city = city;
  if (category) filter.category = category;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { count, rows } = await Shop.findAndCountAll({
    where: filter,
    limit: parseInt(limit as string),
    offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    shops: rows,
    pagination: {
      total: count,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      pages: Math.ceil(count / parseInt(limit as string))
    }
  });
}));

// Get shop by ID
router.get('/:shopId', asyncHandler(async (req: Request, res: Response) => {
  const shop = await Shop.findByPk(req.params.shopId, {
    include: ['owner']
  });

  if (!shop) {
    throw new ApiError('Shop not found', 404);
  }

  res.json(shop);
}));

// Update shop
router.put('/:shopId', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopName, description, openingTime, closingTime, phone, email } = req.body;
  const shop = await Shop.findByPk(req.params.shopId);

  if (!shop) {
    throw new ApiError('Shop not found', 404);
  }

  await shop.update({
    shopName: shopName || shop.shopName,
    description: description || shop.description,
    openingTime: openingTime || shop.openingTime,
    closingTime: closingTime || shop.closingTime,
    phone: phone || shop.phone,
    email: email || shop.email
  });

  res.json({ message: 'Shop updated successfully', shop });
}));

export default router;
