import { Request, Response } from 'express';
import Shop from '../models/Shop';
import Product from '../models/Product';
import Category from '../models/Category';
import CustomFormField from '../models/CustomFormField';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';
import { Op } from 'sequelize';

// Enable public view for shop
const enablePublicView = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.body;

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  await shop.update({ publicView: true });

  res.status(200).json(
    new ApiResponse(200, shop, 'Public view enabled')
  );
});

// Disable public view for shop
const disablePublicView = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.body;

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  await shop.update({ publicView: false });

  res.status(200).json(
    new ApiResponse(200, shop, 'Public view disabled')
  );
});

// Get shop public view status
const getShopPublicViewStatus = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.query;

  if (!shopId) {
    throw new ApiError(400, 'Shop ID is required');
  }

  const shop = await Shop.findByPk(shopId as string);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  res.status(200).json(
    new ApiResponse(200, { publicView: shop.publicView }, 'Public view status fetched')
  );
});

// Get public shops
const getPublicShops = AsyncHandler(async (req: Request, res: Response) => {
  const shops = await Shop.findAll({
    where: { 
      publicView: true,
      isActive: true 
    },
    attributes: ['shopId', 'shopName', 'city', 'shopDescription']
  });

  if (shops.length === 0) {
    throw new ApiError(404, 'No public shops available');
  }

  res.status(200).json(
    new ApiResponse(200, {
      shops,
      totalShops: shops.length
    }, 'Public shops fetched')
  );
});

// Get public products
const getPublicProducts = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.query;

  const whereClause: any = { isActive: true };

  if (shopId) {
    const shop = await Shop.findOne({
      where: { shopId: shopId as string, publicView: true }
    });
    if (!shop) {
      throw new ApiError(404, 'Shop not public');
    }
    whereClause.shopId = shopId as string;
  } else {
    const publicShops = await Shop.findAll({
      where: { publicView: true },
      attributes: ['shopId']
    });
    whereClause.shopId = { [Op.in]: publicShops.map(s => s.shopId) };
  }

  const products = await Product.findAll({
    where: whereClause,
    include: [
      { model: Category, as: 'category', attributes: ['categoryName'] },
      { 
        model: Shop, 
        as: 'shop', 
        attributes: ['shopName', 'city'],
        include: [{
          model: CustomFormField,
          as: 'customForms',
          attributes: ['fieldName', 'fieldValue']
        }]
      }
    ],
    limit: 50
  });

  res.status(200).json(
    new ApiResponse(200, { products }, 'Products fetched')
  );
});

// Get all public products
const getAllPublicProducts = AsyncHandler(async (req: Request, res: Response) => {
  const publicShops = await Shop.findAll({
    where: { publicView: true },
    attributes: ['shopId']
  });

  if (publicShops.length === 0) {
    throw new ApiError(404, 'No public shops available');
  }

  const shopIds = publicShops.map(s => s.shopId);

  const products = await Product.findAll({
    where: {
      isActive: true,
      shopId: { [Op.in]: shopIds }
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['categoryName']
      },
      {
        model: Shop,
        as: 'shop',
        attributes: ['shopId', 'shopName', 'city'],
        include: [{
          model: CustomFormField,
          as: 'customForms',
          attributes: ['fieldName', 'fieldValue']
        }]
      }
    ],
    limit: 50
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        totalProducts: products.length
      },
      'All public products fetched'
    )
  );
});

// Get public catalog for a specific shop (shop + products + categories)
const getPublicCatalog = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;

  if (!shopId) {
    throw new ApiError(400, 'Shop ID is required');
  }

  // Check if shop exists and is public
  const shop = await Shop.findOne({
    where: { shopId, publicView: true, isActive: true }
  });

  if (!shop) {
    throw new ApiError(404, 'Shop not found or not public');
  }

  // Get products for this shop
  const products = await Product.findAll({
    where: { shopId, isActive: true },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'categoryName'] }
    ],
    order: [['productName', 'ASC']]
  });

  // Get categories for this shop
  const categories = await Category.findAll({
    where: { shopId, isActive: true },
    order: [['categoryName', 'ASC']]
  });

  res.status(200).json(
    new ApiResponse(200, { shop, products, categories }, 'Public catalog fetched')
  );
});

export {
  enablePublicView,
  disablePublicView,
  getShopPublicViewStatus,
  getPublicShops,
  getPublicProducts,
  getAllPublicProducts,
  getPublicCatalog
};
