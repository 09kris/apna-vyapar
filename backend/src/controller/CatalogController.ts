import { Request, Response } from 'express';
import { Shop, Product, Category, CatalogAccess, ShopCustomer } from '../models';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';

// Generate referral code for shop
const generateReferralCode = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params as { shopId: string };

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  // Generate unique referral code
  let referralCode = '';
  let isUnique = false;
  
  while (!isUnique) {
    referralCode = `SHOP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const existingShop = await Shop.findOne({ where: { referralCode } });
    if (!existingShop) {
      isUnique = true;
    }
  }

  await shop.update({ referralCode });

  res.status(200).json(
    new ApiResponse(200, { referralCode }, 'Referral code generated successfully')
  );
});

// Access catalog via referral code
const accessCatalog = AsyncHandler(async (req: Request, res: Response) => {
  const { referralCode, gstNumber, deviceInfo } = req.body;
  const visitorIp = req.ip;
  const userAgent = req.get('User-Agent');

  // Find shop by referral code
  const shop = await Shop.findOne({ 
    where: { referralCode, isActive: true },
    include: [
      {
        model: Category,
        as: 'categories',
        where: { isActive: true },
        required: false
      }
    ]
  });

  if (!shop) {
    throw new ApiError(404, 'Invalid referral code or shop not active');
  }

  // Determine viewing mode based on GST
  const hasGst = !!gstNumber;
  const viewingMode = hasGst ? 'Wholesale' : 'Retail';

  // Log catalog access
  const catalogAccess = await CatalogAccess.create({
    shopId: shop.shopId,
    referralCode,
    visitorIp,
    hasGst,
    gstNumber,
    gstVerified: false, // Would need external API for verification
    viewingMode,
    deviceType: deviceInfo?.type,
    browser: deviceInfo?.browser,
  });

  res.status(200).json(
    new ApiResponse(200, {
      shop: {
        shopId: shop.shopId,
        shopName: shop.shopName,
        shopDescription: shop.shopDescription,
        shopLogo: shop.shopLogo,
        shopBanner: shop.shopBanner,
        businessHours: {
          start: shop.businessHoursStart,
          end: shop.businessHoursEnd
        }
      },
      viewingMode,
      accessId: catalogAccess.accessId
    }, 'Catalog access granted')
  );
});

// Get catalog products
const getCatalogProducts = AsyncHandler(async (req: Request, res: Response) => {
  const { referralCode } = req.params;
  const { page = 1, limit = 20, category, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  const { accessId } = req.body;

  // Find shop by referral code
  const shop = await Shop.findOne({ 
    where: { referralCode: referralCode as string, isActive: true }
  });

  if (!shop) {
    throw new ApiError(404, 'Invalid referral code');
  }

  // Build where clause for products
  const whereClause: any = {
    shopId: shop.shopId,
    isActive: true
  };

  if (category) {
    whereClause.categoryId = category;
  }

  if (search) {
    whereClause.productName = {
      [require('sequelize').Op.iLike]: `%${search}%`
    };
  }

  // Get products with pagination
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

  // Update catalog access with viewed products
  if (accessId) {
    const productIds = products.map(p => p.productId);
    await CatalogAccess.update(
      { 
        productsViewed: productIds,
        lastActivity: new Date()
      },
      { where: { accessId } }
    );
  }

  res.status(200).json(
    new ApiResponse(200, {
      products,
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

// Get catalog analytics
const getCatalogAnalytics = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { startDate, endDate } = req.query;

  const whereClause: any = { shopId: shopId as string };
  
  if (startDate && endDate) {
    whereClause.accessedAt = {
      [require('sequelize').Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  // Get access statistics
  const totalAccess = await CatalogAccess.count({ where: whereClause });
  const uniqueVisitors = await CatalogAccess.count({
    where: whereClause,
    distinct: true,
    col: 'visitorIp'
  });

  const conversions = await CatalogAccess.count({
    where: { ...whereClause, orderPlaced: true }
  });

  const avgSessionDuration = await CatalogAccess.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').col('sessionDuration')), 'avgDuration']
    ]
  });

  // Device type breakdown
  const deviceStats = await CatalogAccess.findAll({
    where: whereClause,
    attributes: [
      'deviceType',
      [require('sequelize').fn('COUNT', require('sequelize').col('deviceType')), 'count']
    ],
    group: ['deviceType']
  });

  // Viewing mode breakdown
  const viewingModeStats = await CatalogAccess.findAll({
    where: whereClause,
    attributes: [
      'viewingMode',
      [require('sequelize').fn('COUNT', require('sequelize').col('viewingMode')), 'count']
    ],
    group: ['viewingMode']
  });

  res.status(200).json(
    new ApiResponse(200, {
      totalAccess,
      uniqueVisitors,
      conversions,
      conversionRate: totalAccess > 0 ? ((conversions / totalAccess) * 100).toFixed(2) : 0,
      avgSessionDuration: avgSessionDuration?.get('avgDuration') || 0,
      deviceStats,
      viewingModeStats
    }, 'Analytics fetched successfully')
  );
});

export {
  generateReferralCode,
  accessCatalog,
  getCatalogProducts,
  getCatalogAnalytics
};