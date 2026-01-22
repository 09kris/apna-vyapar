import express, { Router, Request, Response } from 'express';
import { Product, Category } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router: Router = express.Router();

// Get products
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { shopId, categoryId, search, inStock, page = '1', limit = '20' } = req.query;
  const filter: any = { isActive: true };

  if (shopId) filter.shopId = shopId;
  if (categoryId) filter.categoryId = categoryId;
  if (inStock === 'true') filter.stockQuantity = { [Op.gt]: 0 };
  if (search) filter.productName = { [Op.like]: `%${search}%` };

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { count, rows } = await Product.findAndCountAll({
    where: filter,
    limit: parseInt(limit as string),
    offset,
    include: ['category'],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    products: rows,
    pagination: { total: count, page: parseInt(page as string), limit: parseInt(limit as string) }
  });
}));

// Get product
router.get('/:productId', asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.productId);
  const product = await Product.findByPk(productId, { include: ['category'] });
  if (!product) throw new ApiError('Product not found', 404);
  res.json(product);
}));

// Create product
router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, categoryId, productCode, productName, retailPrice, wholesalePrice,
    costPrice, mrp, taxPercentage, stockQuantity, unit } = req.body;

  if (!shopId || !productCode || !productName || !retailPrice) {
    throw new ApiError('Missing required fields', 400);
  }

  const product = await Product.create({
    shopId, categoryId, productCode, productName, retailPrice, wholesalePrice,
    costPrice, mrp, taxPercentage, stockQuantity, unit,
    reorderLevel: 10, maxStockLevel: 1000, isActive: true, isFeatured: false,
    discountPercentage: 0, ...req.body
  });

  res.status(201).json({ message: 'Product created successfully', product });
}));

// Update product
router.put('/:productId', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findByPk(req.params.productId);
  if (!product) throw new ApiError('Product not found', 404);

  await product.update(req.body);
  res.json({ message: 'Product updated successfully', product });
}));

// Delete product
router.delete('/:productId', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findByPk(req.params.productId);
  if (!product) throw new ApiError('Product not found', 404);

  await product.update({ isActive: false });
  res.json({ message: 'Product deleted successfully' });
}));

export default router;
