import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Product from '../models/Product';
import Category from '../models/Category';
import CustomFormField from '../models/CustomFormField';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import Employee from '../models/Employee';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

const verifyShopOwnership = async (shopId: string, userId: string): Promise<Shop> => {
  // First, look up the ShopOwner by userId to get the correct ownerId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner) {
    throw new ApiError(403, 'Shop owner profile not found');
  }
  
  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(403, 'Shop not found or you do not have permission to access it');
  }

  // Check ownership properly - compare shopOwner.ownerId with shop.ownerId
  if (shop.ownerId !== shopOwner.ownerId) {
    throw new ApiError(403, 'You do not have permission to access this shop');
  }

  return shop;
};

// allow either owner or active employee to access shop resources
const verifyShopAccess = async (shopId: string, userId: string): Promise<Shop> => {
  // First, look up the ShopOwner by userId to get the correct ownerId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  
  // Get the shop
  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }
  
  // Check if user is the shop owner (compare shopOwner.ownerId with shop.ownerId)
  if (shopOwner && shop.ownerId === shopOwner.ownerId) {
    return shop;
  }

  // Check if user is active employee - First try with userId
  let employee = await Employee.findOne({ 
    where: { shopId, userId, isActive: true } 
  });

  // If no employee found with userId, try to find by linking through User table
  if (!employee) {
    // Find the user by userId to get their email/phone, then find employee
    const User = (await import('../models/User')).default;
    const user = await User.findByPk(userId);
    
    if (user) {
      // Try finding employee by email or phone matching
      employee = await Employee.findOne({
        where: { 
          shopId, 
          isActive: true,
          [Op.or]: [
            { email: user.email },
            { phone: user.phoneNumber }
          ]
        }
      });
    }
  }

  // If still no employee found, check if there's ANY active employee for this shop (fallback)
  // This helps if employee record exists but userId wasn't properly linked
  if (!employee) {
    const employeesInShop = await Employee.findAll({
      where: { shopId, isActive: true },
      limit: 1
    });
    
    // Only allow access if there's exactly one employee and no owner match
    // This is a fallback for improperly configured employee records
    if (employeesInShop.length === 1 && !shopOwner) {
      console.warn(`⚠️ Allowing access to shop ${shopId} for user ${userId} - employee record found but userId not linked`);
      return shop;
    }
  }

  if (employee) {
    return shop;
  }

  throw new ApiError(403, 'Unauthorized - you do not have access to this shop');
};

/* ==============================
   CONFIGURE PRODUCT FIELDS
============================== */
export const configureProductFields = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { fields } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!Array.isArray(fields)) throw new ApiError(400, 'Fields must be an array');

  await verifyShopAccess(shopId, userId);

  let config = await CustomFormField.findOne({
    where: { shopId, tableName: 'Product' },
  });

  if (config) {
    await config.update({ fields: JSON.stringify(fields), updatedBy: userId });
  } else {
    config = await CustomFormField.create({
      shopId,
      tableName: 'Product',
      fields: JSON.stringify(fields),
      status: 'ACTIVE',
      createdBy: userId,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, config, 'Product fields configured successfully'),
  );
});

/* ==============================
   GET PRODUCT FIELD CONFIG
============================== */
export const getProductFieldConfiguration = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const config = await CustomFormField.findOne({
    where: { shopId, tableName: 'Product' },
  });

  if (!config) throw new ApiError(404, 'No product configuration found');

  return res.status(200).json(
    new ApiResponse(
      200,
      { ...config.toJSON(), fields: JSON.parse(config.fields) },
      'Product field configuration retrieved',
    ),
  );
});

/* ==============================
   ADD PRODUCT
============================== */
export const addProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  await verifyShopAccess(shopId, userId);

  const {
    productName,
    categoryId,
    retailPrice,
    wholesalePrice,
    unit,
    productCode,
  } = req.body;

  if (!productName || !categoryId || !retailPrice || !wholesalePrice || !unit) {
    throw new ApiError(400, 'Missing required product fields');
  }

  const category = await Category.findOne({ where: { categoryId, shopId } });
  let categoryCreated = false;
  
  // If category doesn't exist, create a default "General" category for the shop
  if (!category) {
    // Check if categoryId was provided but invalid
    if (categoryId) {
      console.warn(`Category ${categoryId} not found for shop ${shopId}. Creating default "General" category.`);
    }
    
    // Create default "General" category
    const defaultCategory = await Category.create({
      shopId,
      categoryName: 'General',
      description: 'Default category for products',
      sortOrder: 0,
      isActive: true,
    });
    
    // Use the new default category's ID for the product
    req.body.categoryId = defaultCategory.categoryId;
    categoryCreated = true;
  }

  if (productCode) {
    const exists = await Product.findOne({ where: { shopId, productCode } });
    if (exists) throw new ApiError(409, 'Product code already exists');
  }

  const product = await Product.create({ shopId, ...req.body });

  // Fetch the category to include in response
  const createdCategory = await Category.findByPk(req.body.categoryId);

  // Build response data
  const responseData: any = {
    product,
    category: createdCategory,
    categoryCreated
  };

  const message = categoryCreated 
    ? 'Product added successfully. A default "General" category was created for this shop.'
    : 'Product added successfully';

  return res.status(201).json(
    new ApiResponse(201, responseData, message),
  );
});

/* ==============================
   GET SHOP PRODUCTS
============================== */
export const getShopProducts = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  
  // Pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const search = req.query.search as string;
  const categoryId = req.query.categoryId as string;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  await verifyShopAccess(shopId, userId);

  // Build where clause
  const whereClause: any = { shopId, isActive: true };
  
  if (search) {
    whereClause[require('sequelize').Op.or] = [
      { productName: { [require('sequelize').Op.like]: `%${search}%` } },
      { productCode: { [require('sequelize').Op.like]: `%${search}%` } },
      { brand: { [require('sequelize').Op.like]: `%${search}%` } }
    ];
  }
  
  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  // Get total count
  const total = await Product.count({ where: whereClause });
  
  // Get paginated products
  const products = await Product.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: (page - 1) * limit
  });

  // Return in paginated format that frontend expects
  return res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      items: products,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

/* ==============================
   GET PRODUCT BY ID
============================== */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = (req as any).params;

  const product = await Product.findByPk(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  return res.status(200).json(
    new ApiResponse(200, product, 'Product retrieved successfully'),
  );
});

/* ==============================
   UPDATE PRODUCT
============================== */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { productId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const product = await Product.findByPk(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  await verifyShopAccess(product.shopId, userId);

  await product.update(req.body);

  return res.status(200).json(
    new ApiResponse(200, product, 'Product updated successfully'),
  );
});

/* ==============================
   DELETE PRODUCT (SOFT)
============================== */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { productId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const product = await Product.findByPk(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  await verifyShopAccess(product.shopId, userId);

  await product.update({ isActive: false });

  return res.status(200).json(
    new ApiResponse(200, null, 'Product deleted successfully'),
  );
});


/* ==============================
   GET PRODUCTS BY SHOP REFERENCE CODE (PUBLIC)
============================== */
export const getProductsByReferenceCode = asyncHandler(
  async (req: Request, res: Response) => {
    const { referenceCode } = (req as any).params;

    if (!referenceCode) {
      throw new ApiError(400, 'referenceCode is required');
    }

    // Find shop by reference code
    const shop = await Shop.findOne({
      where: { referenceCode, isActive: true },
    });

    if (!shop) {
      throw new ApiError(404, 'Invalid or inactive shop reference code');
    }

    // Fetch active products of the shop
    const products = await Product.findAll({
      where: {
        shopId: shop.shopId,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          shop: {
            shopId: shop.shopId,
            shopName: shop.shopName,
            city: shop.city,
            referenceCode: shop.referenceCode,
          },
          products,
        },
        'Products retrieved successfully',
      ),
    );
  },
);
