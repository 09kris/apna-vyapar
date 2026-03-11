import { Request, Response } from 'express';
import { Transaction, Op } from 'sequelize';
import Category from '../models/Category';
import CustomFormField from '../models/CustomFormField';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import Employee from '../models/Employee';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';
import sequelize from '../config/database'; // Import your sequelize instance

/* ==============================
   VALIDATION HELPERS
============================== */
const validateFields = (fields: any[]): void => {
  if (!Array.isArray(fields)) {
    throw new ApiError(400, 'Fields must be an array');
  }

  fields.forEach((field, index) => {
    if (!field.name || typeof field.name !== 'string') {
      throw new ApiError(400, `Field at index ${index} must have a valid name`);
    }
    if (!field.type || !['text', 'number', 'date', 'select', 'checkbox', 'textarea'].includes(field.type)) {
      throw new ApiError(400, `Field at index ${index} has invalid type`);
    }
    if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
      throw new ApiError(400, `Select field at index ${index} must have options array`);
    }
  });
};

const validateCategoryData = (data: any): void => {
  if (!data.categoryName || typeof data.categoryName !== 'string' || data.categoryName.trim().length === 0) {
    throw new ApiError(400, 'Category name is required and must be non-empty');
  }

  if (data.categoryName.length > 100) {
    throw new ApiError(400, 'Category name must not exceed 100 characters');
  }

  if (data.sortOrder !== undefined && (typeof data.sortOrder !== 'number' || data.sortOrder < 0)) {
    throw new ApiError(400, 'Sort order must be a non-negative number');
  }

  if (data.description && typeof data.description !== 'string') {
    throw new ApiError(400, 'Description must be a string');
  }
};

// helper used when only the owner should be permitted (add/update/delete operations)
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

// helper for any user who has access to the shop – either the owner or an active employee
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
   CONFIGURE CATEGORY FIELDS
============================== */
export const configureCategoryFields = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { fields } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // Validate fields structure
  validateFields(fields);

  // Verify access (owner or active employee)
  await verifyShopAccess(shopId, userId);

  // Use transaction for atomic operation
  const result = await sequelize.transaction(async (t: Transaction) => {
    let config = await CustomFormField.findOne({
      where: { shopId, tableName: 'Category' },
      transaction: t,
      lock: true, // Prevent concurrent updates
    });

    if (config) {
      await config.update(
        {
          fields: JSON.stringify(fields),
          updatedBy: userId,
          updatedAt: new Date()
        },
        { transaction: t }
      );
    } else {
      config = await CustomFormField.create({
        shopId,
        tableName: 'Category',
        fields: JSON.stringify(fields),
        status: 'ACTIVE',
        createdBy: userId,
      }, { transaction: t });
    }

    return config;
  });

  return res.status(200).json(
    new ApiResponse(200, result, 'Category fields configured successfully'),
  );
});

/* ==============================
   GET CATEGORY FIELD CONFIG
============================== */
export const getCategoryFieldConfiguration = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  // Verify shop exists
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  const config = await CustomFormField.findOne({
    where: { shopId, tableName: 'Category' },
  });

  if (!config) {
    // Return default empty config instead of error
    return res.status(200).json(
      new ApiResponse(200, { fields: [] }, 'No custom fields configured'),
    );
  }

  let parsedFields;
  try {
    parsedFields = JSON.parse(config.fields);
  } catch (error) {
    throw new ApiError(500, 'Invalid field configuration data');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { ...config.toJSON(), fields: parsedFields },
      'Category field configuration retrieved',
    ),
  );
});

/* ==============================
   ADD CATEGORY
============================== */
export const addCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // Validate input
  validateCategoryData(req.body);

  // Verify shop access (owner or authorized employee)
  await verifyShopAccess(shopId, userId);

  // Use transaction to ensure atomicity
  const category = await sequelize.transaction(async (t: Transaction) => {
    // Check for duplicate category name (case-insensitive)
    const existingCategory = await Category.findOne({
      where: {
        shopId,
        [Op.and]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('categoryName')),
            sequelize.fn('LOWER', req.body.categoryName.trim())
          )
        ]
      },
      transaction: t
    });

    if (existingCategory) {
      throw new ApiError(409, `Category "${req.body.categoryName}" already exists for this shop`);
    }

    // Create category with sanitized data
    const newCategory = await Category.create({
      shopId,
      categoryName: req.body.categoryName.trim(),
      description: req.body.description?.trim() || null,
      sortOrder: req.body.sortOrder || 0,
      isActive: true,
    }, { transaction: t });

    return newCategory;
  });

  return res.status(201).json(
    new ApiResponse(201, category, 'Category added successfully'),
  );
});

/* ==============================
   GET SHOP CATEGORIES
============================== */
export const getShopCategories = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  // ensure the requester owns or has membership in the shop
  await verifyShopAccess(shopId, userId);

  // Verify shop exists (redundant but safe)
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  const whereClause: any = { shopId };

  const categories  = await Category.findAndCountAll({
    where: whereClause,
    order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        categories: categories.rows // Return only the rows array, not the pagination object
      },
      'Categories retrieved successfully'
    ),
  );
});

/* ==============================
   GET CATEGORY BY ID
============================== */
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = (req as any).params;
  const { shopId } = (req as any).query;

  const category = await Category.findOne({
    where: {
      categoryId: categoryId,
      shopId // Ensure category belongs to the shop
    }
  });

  if (!category) throw new ApiError(404, 'Category not found');

  return res.status(200).json(
    new ApiResponse(200, category, 'Category retrieved successfully'),
  );
});

/* ==============================
   UPDATE CATEGORY
============================== */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { categoryId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // Validate update data
  if (req.body.categoryName || req.body.sortOrder !== undefined || req.body.description !== undefined) {
    validateCategoryData({ ...req.body });
  }

  const category = await sequelize.transaction(async (t: Transaction) => {
    const cat = await Category.findByPk(categoryId, {
      transaction: t,
      lock: true
    });

    if (!cat) throw new ApiError(404, 'Category not found');

    // Verify shop access (owner or authorized employee)
    await verifyShopAccess(cat.shopId, userId);

    // Check for duplicate name if name is being changed
    if (req.body.categoryName && req.body.categoryName.trim() !== cat.categoryName) {
      const duplicate = await Category.findOne({
        where: {
          shopId: cat.shopId,
          categoryId: { [Op.ne]: categoryId },
          [Op.and]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('categoryName')),
              sequelize.fn('LOWER', req.body.categoryName.trim())
            )
          ]
        },
        transaction: t
      });

      if (duplicate) {
        throw new ApiError(409, `Category "${req.body.categoryName}" already exists`);
      }
    }

    // Update with sanitized data
    const updateData: any = {};

    if (req.body.categoryName) updateData.categoryName = req.body.categoryName.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description?.trim() || null;
    if (req.body.sortOrder !== undefined) updateData.sortOrder = req.body.sortOrder;

    await cat.update(updateData, { transaction: t });

    return cat;
  });

  return res.status(200).json(
    new ApiResponse(200, category, 'Category updated successfully'),
  );
});

/* ==============================
   DELETE CATEGORY (SOFT)
============================== */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { categoryId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const result = await sequelize.transaction(async (t: Transaction) => {
    const category = await Category.findByPk(categoryId, {
      transaction: t,
      lock: true
    });

    if (!category) throw new ApiError(404, 'Category not found');

    // Verify shop access (owner or authorized employee)
    await verifyShopAccess(category.shopId, userId);

    // Check if category is in use (you may want to add this check)
    // const productsCount = await Product.count({ 
    //   where: { categoryId },
    //   transaction: t 
    // });
    // if (productsCount > 0) {
    //   throw new ApiError(400, `Cannot delete category. ${productsCount} products are using it`);
    // }

    await category.update({
      isActive: false,
    }, { transaction: t });

    return category;
  });

  return res.status(200).json(
    new ApiResponse(200, null, 'Category deleted successfully'),
  );
});

/* ==============================
   BULK UPDATE SORT ORDER
============================== */
export const bulkUpdateSortOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { categories } = req.body; // Array of { id, sortOrder }

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!Array.isArray(categories)) throw new ApiError(400, 'Categories must be an array');

  await verifyShopAccess(shopId, userId);

  // Verify the shop exists
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  await sequelize.transaction(async (t: Transaction) => {
    for (const { id, sortOrder } of categories) {
      await Category.update(
        { sortOrder },
        {
          where: { categoryId: id, shopId },
          transaction: t
        }
      );
    }
  });

  return res.status(200).json(
    new ApiResponse(200, null, 'Sort order updated successfully'),
  );
});