import express, { Router, Request, Response } from 'express';
import { Location, Shop } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router: Router = express.Router();

// Haversine formula for distance
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Search shops by location
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = '10', category, city } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError('Latitude and longitude required', 400);
  }

  const lat = parseFloat(latitude as string);
  const lon = parseFloat(longitude as string);
  const rad = parseInt(radius as string);

  const locations = await Location.findAll({
    include: [{ association: 'shop', where: { isActive: true } }],
    raw: false
  });

  const nearby = locations
    .map(loc => ({
      ...loc.toJSON(),
      distance: haversineDistance(lat, lon, parseFloat(loc.latitude as any), parseFloat(loc.longitude as any))
    }))
    .filter(loc => loc.distance <= rad)
    .sort((a, b) => a.distance - b.distance);

  res.json({ shops: nearby, total: nearby.length, search: { latitude: lat, longitude: lon, radius: rad } });
}));

// Get nearby shops
router.get('/nearby', asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = '5' } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError('Latitude and longitude required', 400);
  }

  const lat = parseFloat(latitude as string);
  const lon = parseFloat(longitude as string);

  const locations = await Location.findAll({
    limit: 20,
    include: ['shop']
  });

  const nearby = locations
    .map((loc: any) => ({
      id: loc.shopId,
      ...(loc.shop?.toJSON?.() || {}),
      distance: haversineDistance(lat, lon, parseFloat(loc.latitude as any), parseFloat(loc.longitude as any))
    }))
    .sort((a, b) => a.distance - b.distance);

  res.json(nearby);
}));

// Create location
router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, city, area, landmark, pincode, latitude, longitude, isPrimary = false } = req.body;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum) || !city || !area || !pincode || !latitude || !longitude) {
    throw new ApiError('Missing required fields', 400);
  }

  const location = await Location.create({
    shopId: shopIdNum, city, area, landmark, pincode, latitude, longitude, isPrimary
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
