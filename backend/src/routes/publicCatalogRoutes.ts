import { Router } from 'express';
import {
  enablePublicView,
  disablePublicView,
  getShopPublicViewStatus,
  getPublicShops,
  getPublicProducts,
  getAllPublicProducts,
  getPublicCatalog
} from '../controller/PublicCatalogController';
import {authMiddleware} from '../middleware/authMiddleware';

const router = Router();

// Enable public view for shop (protected)
router.post('/public-catalog/enable', authMiddleware, enablePublicView);

// Disable public view for shop (protected)
router.post('/public-catalog/disable', authMiddleware, disablePublicView);

// Get shop public view status (protected)
router.get('/public-catalog/status', authMiddleware, getShopPublicViewStatus);

// Get public shops (public)
router.get('/public-catalog/shops', getPublicShops);

// Get public catalog for a specific shop (public)
router.get('/public-catalog/:shopId', getPublicCatalog);

// Get public catalog products (public)
router.get('/public-catalog/products', getPublicProducts);

// Get all public products from all shops (public)
router.get('/public-catalog/all-products', getAllPublicProducts);

export default router;
