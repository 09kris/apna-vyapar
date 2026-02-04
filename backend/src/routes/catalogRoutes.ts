import { Router } from 'express';
import {
  generateReferralCode,
  accessCatalog,
  getCatalogProducts,
  getCatalogAnalytics
} from '../controller/CatalogController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Generate referral code for shop (protected)
router.post('/shops/:shopId/referral-code', authMiddleware, generateReferralCode);

// Public catalog access via referral code
router.post('/catalog/access', accessCatalog);

// Get catalog products (public)
router.get('/catalog/:referralCode/products', getCatalogProducts);

// Get catalog analytics (protected)
router.get('/shops/:shopId/catalog/analytics', authMiddleware, getCatalogAnalytics);

export default router;