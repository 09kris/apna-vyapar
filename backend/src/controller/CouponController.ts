import { Request, Response } from 'express';
import { Coupon, Shop } from '../models';
import ShopOwner from '../models/ShopOwner';
import Employee from '../models/Employee';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';

/* =====================================
   HELPERS
===================================== */

const verifyShopAccess = async (userId: string, shopId: string) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  // First, look up the ShopOwner by userId to get the correct ownerId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  
  // Check if user is the shop owner (compare shopOwner.ownerId with shop.ownerId)
  if (shopOwner && shop.ownerId === shopOwner.ownerId) {
    return shop;
  }

  // Check if user is an active employee of the shop
  const employee = await Employee.findOne({
    where: {
      userId: userId,
      shopId: shopId,
      isActive: true
    }
  });

  if (!employee) {
    throw new ApiError(403, 'Unauthorized - not a shop owner or active employee');
  }

  return shop;
};

// Create coupon
const createCoupon = AsyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const {
    shopId,
    couponCode,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    usageLimit,
    validFrom,
    validUntil,
    applicableTo,
    applicableItems,
    description
  } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // Verify shop access
  await verifyShopAccess(userId, shopId);

  // Check if coupon code already exists
  const existingCoupon = await Coupon.findOne({ where: { couponCode } });
  if (existingCoupon) {
    throw new ApiError(400, 'Coupon code already exists');
  }

  // Validate shop exists
  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const coupon = await Coupon.create({
    shopId,
    couponCode: couponCode.toUpperCase(),
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    usageLimit,
    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),
    applicableTo,
    applicableItems,
    description,
    createdBy: userId
  });

  res.status(201).json(
    new ApiResponse(201, coupon, 'Coupon created successfully')
  );
});

// Get shop coupons
const getShopCoupons = AsyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const shopId = req.params.shopId as string;
  const { page = 1, limit = 20, isActive, search } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // Verify shop access
  await verifyShopAccess(userId, shopId);

  const whereClause: any = { shopId };
  
  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  if (search) {
    whereClause.couponCode = {
      [require('sequelize').Op.iLike]: `%${search}%`
    };
  }

  const offset = (Number(page) - 1) * Number(limit);
  
  const { rows: coupons, count: totalCoupons } = await Coupon.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset
  });

  res.status(200).json(
    new ApiResponse(200, {
      coupons,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCoupons / Number(limit)),
        totalCoupons,
        hasNext: offset + Number(limit) < totalCoupons,
        hasPrev: Number(page) > 1
      }
    }, 'Coupons fetched successfully')
  );
});

// Validate coupon
const validateCoupon = AsyncHandler(async (req: Request, res: Response) => {
  const { couponCode, orderAmount, shopId, applicableItems } = req.body;

  const coupon = await Coupon.findOne({
    where: {
      couponCode: couponCode.toUpperCase(),
      shopId,
      isActive: true
    }
  });

  if (!coupon) {
    throw new ApiError(404, 'Invalid coupon code');
  }

  const now = new Date();
  
  // Check validity period
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new ApiError(400, 'Coupon has expired or not yet valid');
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit exceeded');
  }

  // Check minimum purchase
  if (coupon.minPurchase && orderAmount < coupon.minPurchase) {
    throw new ApiError(400, `Minimum purchase amount is ₹${coupon.minPurchase}`);
  }

  // Check applicable items
  if (coupon.applicableTo !== 'All' && applicableItems) {
    const hasApplicableItems = applicableItems.some((item: string) => 
      coupon.applicableItems?.includes(item)
    );
    
    if (!hasApplicableItems) {
      throw new ApiError(400, 'Coupon not applicable to selected items');
    }
  }

  // Calculate discount
  let discountAmount = 0;
  
  if (coupon.discountType === 'Percentage') {
    discountAmount = (orderAmount * coupon.discountValue) / 100;
    
    // Apply max discount limit
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed order amount
  if (discountAmount > orderAmount) {
    discountAmount = orderAmount;
  }

  res.status(200).json(
    new ApiResponse(200, {
      coupon: {
        couponId: coupon.couponId,
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description
      },
      discountAmount,
      finalAmount: orderAmount - discountAmount
    }, 'Coupon validated successfully')
  );
});

// Apply coupon (increment usage count)
const applyCoupon = AsyncHandler(async (req: Request, res: Response) => {
  const { couponCode, shopId } = req.body;

  const coupon = await Coupon.findOne({
    where: {
      couponCode: couponCode.toUpperCase(),
      shopId,
      isActive: true
    }
  });

  if (!coupon) {
    throw new ApiError(404, 'Invalid coupon code');
  }

  // Increment usage count
  await coupon.update({
    usedCount: coupon.usedCount + 1
  });

  res.status(200).json(
    new ApiResponse(200, {
      couponId: coupon.couponId,
      usedCount: coupon.usedCount
    }, 'Coupon applied successfully')
  );
});

// Update coupon
const updateCoupon = AsyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const couponId = req.params.couponId as string;
  const updateData = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const coupon = await Coupon.findByPk(couponId);
  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  // Verify shop access
  await verifyShopAccess(userId, coupon.shopId);

  // If updating coupon code, check uniqueness
  if (updateData.couponCode && updateData.couponCode !== coupon.couponCode) {
    const existingCoupon = await Coupon.findOne({
      where: { couponCode: updateData.couponCode.toUpperCase() }
    });
    if (existingCoupon) {
      throw new ApiError(400, 'Coupon code already exists');
    }
    updateData.couponCode = updateData.couponCode.toUpperCase();
  }

  await coupon.update(updateData);

  res.status(200).json(
    new ApiResponse(200, coupon, 'Coupon updated successfully')
  );
});

// Delete coupon
const deleteCoupon = AsyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const couponId = req.params.couponId as string;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const coupon = await Coupon.findByPk(couponId);
  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  // Verify shop access
  await verifyShopAccess(userId, coupon.shopId);

  await coupon.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'Coupon deleted successfully')
  );
});

// Generate coupon code
const generateCouponCode = AsyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { prefix = '', length = 8 } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  let couponCode = '';
  let isUnique = false;
  
  while (!isUnique) {
    const randomPart = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    couponCode = prefix ? `${prefix}${randomPart}` : randomPart;
    
    const existingCoupon = await Coupon.findOne({ where: { couponCode } });
    if (!existingCoupon) {
      isUnique = true;
    }
  }

  res.status(200).json(
    new ApiResponse(200, { couponCode }, 'Coupon code generated successfully')
  );
});

// Get coupon statistics
const getCouponStats = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { startDate, endDate } = req.query;

  const whereClause: any = { shopId };
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [require('sequelize').Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  // Total coupons
  const totalCoupons = await Coupon.count({ where: whereClause });
  const activeCoupons = await Coupon.count({
    where: { ...whereClause, isActive: true }
  });

  // Usage statistics
  const totalUsage = await Coupon.sum('usedCount', { where: whereClause });

  // Most used coupons
  const topCoupons = await Coupon.findAll({
    where: whereClause,
    order: [['usedCount', 'DESC']],
    limit: 5,
    attributes: ['couponId', 'couponCode', 'usedCount', 'discountType', 'discountValue']
  });

  // Discount type breakdown
  const discountTypeStats = await Coupon.findAll({
    where: whereClause,
    attributes: [
      'discountType',
      [require('sequelize').fn('COUNT', require('sequelize').col('discountType')), 'count']
    ],
    group: ['discountType']
  });

  res.status(200).json(
    new ApiResponse(200, {
      totalCoupons,
      activeCoupons,
      totalUsage: totalUsage || 0,
      topCoupons,
      discountTypeStats
    }, 'Coupon statistics fetched successfully')
  );
});

export {
  createCoupon,
  getShopCoupons,
  validateCoupon,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
  generateCouponCode,
  getCouponStats
};