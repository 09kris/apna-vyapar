import { Request, Response } from 'express';
import Category from '../models/Category';
import CustomFormField from '../models/CustomFormField';
import Shop from '../models/Shop';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* ==============================
   CONFIGURE CATEGORY FIELDS
============================== */
export const configureCategoryFields = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { fields } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!Array.isArray(fields)) throw new ApiError(400, 'Fields must be an array');

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  let config = await CustomFormField.findOne({
    where: { shopId, tableName: 'Category' },
  });

  if (config) {
    await config.update({ fields: JSON.stringify(fields), updatedBy: userId });
  } else {
    config = await CustomFormField.create({
      shopId,
      tableName: 'Category',
      fields: JSON.stringify(fields),
      status: 'ACTIVE',
      createdBy: userId,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, config, 'Category fields configured successfully'),
  );
});

/* ==============================
   GET CATEGORY FIELD CONFIG
============================== */
export const getCategoryFieldConfiguration = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const config = await CustomFormField.findOne({
    where: { shopId, tableName: 'Category' },
  });

  if (!config) throw new ApiError(404, 'No category configuration found');

  return res.status(200).json(
    new ApiResponse(
      200,
      { ...config.toJSON(), fields: JSON.parse(config.fields) },
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

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  if (!req.body.categoryName) {
    throw new ApiError(400, 'Category name is required');
  }

  const category = await Category.create({ shopId, ...req.body });

  return res.status(201).json(
    new ApiResponse(201, category, 'Category added successfully'),
  );
});

/* ==============================
   GET SHOP CATEGORIES
============================== */
export const getShopCategories = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const categories = await Category.findAll({
    where: { shopId, isActive: true },
    order: [['sortOrder', 'ASC']],
  });

  return res.status(200).json(
    new ApiResponse(200, categories, 'Categories retrieved successfully'),
  );
});

/* ==============================
   GET CATEGORY BY ID
============================== */
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = (req as any).params;

  const category = await Category.findByPk(categoryId);
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

  const category = await Category.findByPk(categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  const shop = await Shop.findByPk(category.shopId);
  if (!shop || shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  await category.update(req.body);

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

  const category = await Category.findByPk(categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  const shop = await Shop.findByPk(category.shopId);
  if (!shop || shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  await category.update({ isActive: false });

  return res.status(200).json(
    new ApiResponse(200, null, 'Category deleted successfully'),
  );
});
