import { Router } from 'express';
import {
  enablePublicView,
  getPublicShops,
  getPublicProducts,
  getAllPublicProducts
} from '../controller/PublicCatalogController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Enable public view for shop (protected)
router.post('/public-catalog/enable', authMiddleware, enablePublicView);

// Get public shops (public)
router.get('/public-catalog/shops', getPublicShops);

// Get public catalog products (public)
router.get('/public-catalog/products', getPublicProducts);

// Get all public products from all shops (public)
router.get('/public-catalog/all-products', getAllPublicProducts);

export default router;