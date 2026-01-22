import express, { Router, Request, Response } from 'express';
import { Category } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router: Router = express.Router();

// Get all categories with hierarchy
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { shopId, parentId } = req.query;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum)) {
    throw new ApiError('Shop ID required', 400);
  }

  const filter: any = { shopId: shopIdNum, isActive: true };
  if (parentId && parentId !== 'null') {
    filter.parentCategoryId = parentId;
  } else {
    filter.parentCategoryId = null;
  }

  const categories = await Category.findAll({
    where: filter,
    order: [['sortOrder', 'ASC']],
    include: [{ association: 'subCategories', separate: true }]
  });

  res.json({
    count: categories.length,
    data: categories
  });
}));

// Get category by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await Category.findByPk(id, {
    include: [
      { association: 'parentCategory' },
      { association: 'products' },
      { association: 'subCategories' }
    ]
  });

  if (!category) {
    throw new ApiError('Category not found', 404);
  }

  res.json(category);
}));

// Create category
router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, categoryName, parentCategoryId, description, imageUrl } = req.body;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum) || !categoryName) {
    throw new ApiError('Shop ID and category name required', 400);
  }

  const category = await Category.create({
    shopId: shopIdNum,
    categoryName,
    parentCategoryId: parentCategoryId || null,
    description,
    imageUrl,
    sortOrder: 999,
    isActive: true
  });

  res.status(201).json(category);
}));

// Update category
router.put('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { categoryName, parentCategoryId, description, imageUrl, sortOrder } = req.body;

  const category = await Category.findByPk(id);

  if (!category) {
    throw new ApiError('Category not found', 404);
  }

  await category.update({
    categoryName: categoryName || category.categoryName,
    parentCategoryId: parentCategoryId !== undefined ? parentCategoryId : category.parentCategoryId,
    description: description || category.description,
    imageUrl: imageUrl || category.imageUrl,
    sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder
  });

  res.json(category);
}));

// Delete category (soft delete)
router.delete('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const category = await Category.findByPk(id);

  if (!category) {
    throw new ApiError('Category not found', 404);
  }

  await category.update({ isActive: false });

  res.json({ message: 'Category deleted successfully' });
}));

export default router;
