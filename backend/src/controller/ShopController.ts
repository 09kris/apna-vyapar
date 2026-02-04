import { Request, Response } from 'express';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';
import { generateUniqueReferralCode } from '../utils/helpers';

interface AddShopRequest extends Request {
  body: {
    shopName: string;
    shopDescription?: string;
    shopCategory?: string;
    shopType: 'RETAIL' | 'WHOLESALE' | 'ECOMMERCE' | 'FRANCHISE' | 'OTHER';
    phoneNumber: string;
    email: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    businessHoursStart?: string;
    businessHoursEnd?: string;
    establishedYear?: number;
    bankAccountHolderName?: string;
    bankAccountNumber?: string;
    bankName?: string;
    bankBranchCode?: string;
    bankIfscCode?: string;
    upiId?: string;
  };
  user?: { userId: string };
}

interface UpdateShopRequest extends Request {
  body: Partial<AddShopRequest['body']>;
  user?: { userId: string };
}

// Add Shop
export const addShop = asyncHandler(async (req: AddShopRequest, res: Response) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  // Check if user is a shop owner
  const user = await User.findByPk(userId);
  if (!user || user.userType !== 'SHOP_OWNER') {
    throw new ApiError(403, 'Only shop owners can add shops');
  }

  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner) {
    throw new ApiError(404, 'Shop owner profile not found');
  }

  // Validate required fields
  const { shopName, shopType, phoneNumber, email, address, city, state, zipCode, country } = req.body;

  if (!shopName || !shopType || !phoneNumber || !email || !address || !city || !state || !zipCode || !country) {
    throw new ApiError(400, 'Missing required fields');
  }

  // Check if shop email already exists
  const existingShop = await Shop.findOne({ where: { email } });
  if (existingShop) {
    throw new ApiError(409, 'Shop email already registered');
  }

  // Create shop
  const shop = await Shop.create({
    ownerId: shopOwner.ownerId,
    shopName,
    shopDescription: req.body.shopDescription,
    shopCategory: req.body.shopCategory,
    shopType,
    phoneNumber,
    email,
    website: req.body.website,
    address,
    city,
    state,
    zipCode,
    country,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    businessHoursStart: req.body.businessHoursStart,
    businessHoursEnd: req.body.businessHoursEnd,
    establishedYear: req.body.establishedYear,
    bankAccountHolderName: req.body.bankAccountHolderName,
    bankAccountNumber: req.body.bankAccountNumber,
    bankName: req.body.bankName,
    bankBranchCode: req.body.bankBranchCode,
    bankIfscCode: req.body.bankIfscCode,
    upiId: req.body.upiId,
    // Remove auto-generation of referral code
  });

  return res.status(201).json(
    new ApiResponse(201, {
      shopId: shop.shopId,
      shopName: shop.shopName,
      email: shop.email,
      city: shop.city,
      isActive: shop.isActive,
    }, 'Shop added successfully'),
  );
});

// Get All Shops for Shop Owner
export const getMyShops = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner) {
    throw new ApiError(404, 'Shop owner profile not found');
  }

  const shops = await Shop.findAll({
    where: { ownerId: shopOwner.ownerId },
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(
    new ApiResponse(200, shops, 'Shops retrieved successfully'),
  );
});

// Get Single Shop
export const getShopById = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  return res.status(200).json(
    new ApiResponse(200, shop, 'Shop retrieved successfully'),
  );
});

// Update Shop
export const updateShop = asyncHandler(async (req: UpdateShopRequest, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  // Verify ownership
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner || shop.ownerId !== shopOwner.ownerId) {
    throw new ApiError(403, 'Unauthorized: You can only update your own shops');
  }

  // Update shop details
  await shop.update(req.body);

  return res.status(200).json(
    new ApiResponse(200, {
      shopId: shop.shopId,
      shopName: shop.shopName,
      email: shop.email,
      city: shop.city,
    }, 'Shop updated successfully'),
  );
});

// Delete Shop
export const deleteShop = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  // Verify ownership
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner || shop.ownerId !== shopOwner.ownerId) {
    throw new ApiError(403, 'Unauthorized: You can only delete your own shops');
  }

  await shop.destroy();

  return res.status(200).json(
    new ApiResponse(200, null, 'Shop deleted successfully'),
  );
});

// Toggle Shop Active Status
export const toggleShopStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  // Verify ownership
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner || shop.ownerId !== shopOwner.ownerId) {
    throw new ApiError(403, 'Unauthorized: You can only manage your own shops');
  }

  await shop.update({ isActive: !shop.isActive });

  return res.status(200).json(
    new ApiResponse(200, {
      shopId: shop.shopId,
      isActive: shop.isActive,
    }, `Shop ${shop.isActive ? 'activated' : 'deactivated'} successfully`),
  );
});

// Get Shop Statistics
export const getShopStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  // Verify ownership
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner || shop.ownerId !== shopOwner.ownerId) {
    throw new ApiError(403, 'Unauthorized');
  }

  return res.status(200).json(
    new ApiResponse(200, {
      totalProducts: shop.totalProducts || 0,
      totalOrders: shop.totalOrders || 0,
      rating: shop.rating || 0,
      totalReviews: shop.totalReviews || 0,
    }, 'Shop statistics retrieved successfully'),
  );
});


// Add / Update Shop Reference Code
export const updateShopReferenceCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { referenceCode } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  if (!referenceCode) {
    throw new ApiError(400, 'referenceCode is required');
  }

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  // Verify ownership
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner || shop.ownerId !== shopOwner.ownerId) {
    throw new ApiError(403, 'Unauthorized: You can only update your own shop');
  }

  // Optional: ensure referenceCode is unique
  const existingShop = await Shop.findOne({ where: { referenceCode } });
  if (existingShop && existingShop.shopId !== shopId) {
    throw new ApiError(409, 'Reference code already in use');
  }

  await shop.update({ referenceCode });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shopId: shop.shopId,
        referenceCode: shop.referenceCode,
      },
      'Reference code updated successfully',
    ),
  );
});
