import { Router } from 'express';
import {
  generateReferralCode,
  accessCatalog,
  getCatalogProducts,
  getCatalogAnalytics
} from '../controller/CatalogController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Generate referral code for shop (protected - SHOP_OWNER only)
router.post('/shops/:shopId/referral-code', authMiddleware, roleMiddleware(['SHOP_OWNER']), generateReferralCode);

// Public catalog access via referral code
router.post('/catalog/access', accessCatalog);

// Get catalog products (public)
router.get('/catalog/:referralCode/products', getCatalogProducts);

// Get catalog analytics (protected - SHOP_OWNER only)
router.get('/shops/:shopId/catalog/analytics', authMiddleware, roleMiddleware(['SHOP_OWNER']), getCatalogAnalytics);

export default router;
