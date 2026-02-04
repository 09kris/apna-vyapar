import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import CustomFormField from '../models/CustomFormField';
import Shop from '../models/Shop';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* ==============================
   CONFIGURE PRODUCT FIELDS
============================== */
export const configureProductFields = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { fields } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!Array.isArray(fields)) throw new ApiError(400, 'Fields must be an array');

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

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

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

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
  if (!category) throw new ApiError(400, 'Invalid category');

  if (productCode) {
    const exists = await Product.findOne({ where: { shopId, productCode } });
    if (exists) throw new ApiError(409, 'Product code already exists');
  }

  const product = await Product.create({ shopId, ...req.body });

  return res.status(201).json(
    new ApiResponse(201, product, 'Product added successfully'),
  );
});

/* ==============================
   GET SHOP PRODUCTS
============================== */
export const getShopProducts = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const products = await Product.findAll({
    where: { shopId, isActive: true },
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(
    new ApiResponse(200, products, 'Products retrieved successfully'),
  );
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

  const shop = await Shop.findByPk(product.shopId);
  if (!shop || shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

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

  const shop = await Shop.findByPk(product.shopId);
  if (!shop || shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

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
