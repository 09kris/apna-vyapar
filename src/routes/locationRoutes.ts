import express, { Router, Request, Response } from 'express';
import { Location, Shop } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router: Router = express.Router();

// Search shops by city/category
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { city, category, page = '1', limit = '10' } = req.query;

  if (!city && !category) {
    throw new ApiError('City or category required for search', 400);
  }

  const filter: any = {};
  if (city) filter.city = city;

  const locations = await Location.findAll({
    where: filter,
    include: [{ 
      association: 'shop', 
      where: category ? { category } : undefined,
      attributes: ['id', 'shopName', 'category', 'city', 'state', 'address', 'phone', 'email']
    }],
    limit: parseInt(limit as string),
    offset: (parseInt(page as string) - 1) * parseInt(limit as string),
    order: [['createdAt', 'DESC']],
    raw: false,
    subQuery: false
  });

  const shops = locations.map(loc => loc.toJSON());
  res.json({ shops, total: shops.length });
}));

// Get nearby shops (by city)
router.get('/nearby', asyncHandler(async (req: Request, res: Response) => {
  const { city, limit = '10' } = req.query;

  if (!city) {
    throw new ApiError('City required parameter', 400);
  }

  const locations = await Location.findAll({
    where: { city: city as string },
    include: [{ 
      association: 'shop',
      where: { isActive: true },
      attributes: ['id', 'shopName', 'category', 'city', 'state', 'address', 'phone', 'email']
    }],
    limit: parseInt(limit as string),
    order: [['createdAt', 'DESC']]
  });

  const shops = locations.map(loc => loc.toJSON());
  res.json(shops);
}));

// Create location
router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, city, area, landmark, pincode, isPrimary = false } = req.body;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum) || !city || !area || !pincode) {
    throw new ApiError('Missing required fields: shopId, city, area, pincode', 400);
  }

  const location = await Location.create({
    shopId: shopIdNum, city, area, landmark, pincode, isPrimary
  });

  res.status(201).json({ message: 'Location created successfully', location });
}));

// Get shop locations
router.get('/shop/:shopId', asyncHandler(async (req: Request, res: Response) => {
  const shopIdNum = parseInt(req.params.shopId);
  const locations = await Location.findAll({
    where: { shopId: shopIdNum }
  });

  if (locations.length === 0) {
    throw new ApiError('No locations found', 404);
  }

  res.json(locations);
}));

export default router;
