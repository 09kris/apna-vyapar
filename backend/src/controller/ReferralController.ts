import { Request, Response } from 'express';
import ReferralCode from '../models/ReferralCode';
import Shop from '../models/Shop';
import Category from '../models/Category';
import Product from '../models/Product';
import CatalogAccess from '../models/CatalogAccess';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';

// Create referral code with selected categories
const createReferralCode = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId, name, description, selectionType, selectedCategories, selectedProducts } = req.body;
  const userId = (req as any).user?.userId;

  if (selectionType === 'categories' && (!selectedCategories || selectedCategories.length === 0)) {
    throw new ApiError(400, 'At least one category must be selected');
  }
  
  if (selectionType === 'products' && (!selectedProducts || selectedProducts.length === 0)) {
    throw new ApiError(400, 'At least one product must be selected');
  }

  // Generate unique referral code
  let referralCode: string;
  let isUnique = false;
  
  while (!isUnique) {
    referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const existing = await ReferralCode.findOne({ where: { referralCode } });
    if (!existing) {
      isUnique = true;
    }
  }

  const newReferralCode = await ReferralCode.create({
    shopId,
    referralCode: referralCode!,
    name,
    description,
    selectionType,
    selectedCategories: selectionType === 'categories' ? selectedCategories : null,
    selectedProducts: selectionType === 'products' ? selectedProducts : null,
    createdBy: userId
  });

  res.status(201).json(
    new ApiResponse(201, newReferralCode, 'Referral code created successfully')
  );
});

// Get shop referral codes
const getShopReferralCodes = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;

  const referralCodes = await ReferralCode.findAll({
    where: { shopId },
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json(
    new ApiResponse(200, referralCodes, 'Referral codes fetched successfully')
  );
});

// Access catalog via referral code (shows only selected categories)
const accessCatalogByReferral = AsyncHandler(async (req: Request, res: Response) => {
  const { referralCode, gstNumber, deviceInfo } = req.body;
  const visitorIp = req.ip;

  const referral = await ReferralCode.findOne({ 
    where: { referralCode, isActive: true }
  });

  if (!referral) {
    throw new ApiError(404, 'Invalid referral code');
  }

  const shop = await Shop.findByPk(referral.shopId);
  if (!shop || !shop.isActive) {
    throw new ApiError(404, 'Shop not found or inactive');
  }

  const hasGst = !!gstNumber;
  const viewingMode = hasGst ? 'Wholesale' : 'Retail';

  // Log catalog access
  await CatalogAccess.create({
    shopId: referral.shopId,
    referralCode,
    visitorIp,
    hasGst,
    gstNumber,
    gstVerified: false,
    viewingMode,
    deviceType: deviceInfo?.type,
    browser: deviceInfo?.browser,
  });

  res.status(200).json(
    new ApiResponse(200, {
      referral: {
        name: referral.name,
        description: referral.description,
        selectionType: referral.selectionType,
        selectedCategories: referral.selectedCategories,
        selectedProducts: referral.selectedProducts
      },
      shop: shop,
      viewingMode
    }, 'Catalog access granted')
  );
});

// Get products for referral code (filtered by selected categories)
const getReferralProducts = AsyncHandler(async (req: Request, res: Response) => {
  const { referralCode } = req.params;
  const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

  const referral = await ReferralCode.findOne({ 
    where: { referralCode, isActive: true }
  });

  if (!referral) {
    throw new ApiError(404, 'Invalid referral code');
  }

  const whereClause: any = {
    shopId: referral.shopId,
    isActive: true
  };

  // Filter by categories or products based on selection type
  if (referral.selectionType === 'categories') {
    whereClause.categoryId = { [require('sequelize').Op.in]: referral.selectedCategories };
  } else {
    whereClause.productId = { [require('sequelize').Op.in]: referral.selectedProducts };
  }

  if (search) {
    whereClause.productName = {
      [require('sequelize').Op.iLike]: `%${search}%`
    };
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: products, count: totalProducts } = await Product.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['categoryId', 'categoryName']
      }
    ],
    order: [[sortBy as string, sortOrder as string]],
    limit: Number(limit),
    offset
  });

  res.status(200).json(
    new ApiResponse(200, {
      products,
      referralInfo: {
        name: referral.name,
        description: referral.description
      },
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalProducts / Number(limit)),
        totalProducts,
        hasNext: offset + Number(limit) < totalProducts,
        hasPrev: Number(page) > 1
      }
    }, 'Products fetched successfully')
  );
});

// Update referral code
const updateReferralCode = AsyncHandler(async (req: Request, res: Response) => {
  const { referralId } = req.params as { referralId: string };
  const { name, description, selectionType, selectedCategories, selectedProducts, isActive } = req.body;

  const referral = await ReferralCode.findByPk(referralId);
  if (!referral) {
    throw new ApiError(404, 'Referral code not found');
  }

  await referral.update({
    name: name || referral.name,
    description,
    selectionType: selectionType || referral.selectionType,
    selectedCategories: selectionType === 'categories' ? selectedCategories : (selectionType ? null : referral.selectedCategories),
    selectedProducts: selectionType === 'products' ? selectedProducts : (selectionType ? null : referral.selectedProducts),
    isActive: isActive !== undefined ? isActive : referral.isActive
  });

  res.status(200).json(
    new ApiResponse(200, referral, 'Referral code updated successfully')
  );
});

// Delete referral code
const deleteReferralCode = AsyncHandler(async (req: Request, res: Response) => {
  const { referralId } = req.params as { referralId: string };

  const referral = await ReferralCode.findByPk(referralId);
  if (!referral) {
    throw new ApiError(404, 'Referral code not found');
  }

  await referral.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'Referral code deleted successfully')
  );
});

export {
  createReferralCode,
  getShopReferralCodes,
  accessCatalogByReferral,
  getReferralProducts,
  updateReferralCode,
  deleteReferralCode
};