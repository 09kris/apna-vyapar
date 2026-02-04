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

export {
  enablePublicView,
  getPublicShops,
  getPublicProducts,
  getAllPublicProducts
};