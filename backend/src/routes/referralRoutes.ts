import { Router } from 'express';
import {
  createReferralCode,
  getShopReferralCodes,
  accessCatalogByReferral,
  getReferralProducts,
  updateReferralCode,
  deleteReferralCode
} from '../controller/ReferralController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Create referral code with selected categories (protected - SHOP_OWNER only)
router.post('/referral-codes', authMiddleware, roleMiddleware(['SHOP_OWNER']), createReferralCode);

// Get shop referral codes (protected - SHOP_OWNER only)
router.get('/shops/:shopId/referral-codes', authMiddleware, roleMiddleware(['SHOP_OWNER']), getShopReferralCodes);

// Update referral code (protected - SHOP_OWNER only)
router.put('/referral-codes/:referralId', authMiddleware, roleMiddleware(['SHOP_OWNER']), updateReferralCode);

// Delete referral code (protected - SHOP_OWNER only)
router.delete('/referral-codes/:referralId', authMiddleware, roleMiddleware(['SHOP_OWNER']), deleteReferralCode);

// Public catalog access via referral code
router.post('/catalog/access-referral', accessCatalogByReferral);

// Get products for referral code (public)
router.get('/catalog/referral/:referralCode/products', getReferralProducts);

export default router;
