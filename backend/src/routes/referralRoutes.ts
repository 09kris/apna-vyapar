import { Router } from 'express';
import {
  createReferralCode,
  getShopReferralCodes,
  accessCatalogByReferral,
  getReferralProducts,
  updateReferralCode,
  deleteReferralCode
} from '../controller/ReferralController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Create referral code with selected categories (protected)
router.post('/referral-codes', authMiddleware, createReferralCode);

// Get shop referral codes (protected)
router.get('/shops/:shopId/referral-codes', authMiddleware, getShopReferralCodes);

// Update referral code (protected)
router.put('/referral-codes/:referralId', authMiddleware, updateReferralCode);

// Delete referral code (protected)
router.delete('/referral-codes/:referralId', authMiddleware, deleteReferralCode);

// Public catalog access via referral code
router.post('/catalog/access-referral', accessCatalogByReferral);

// Get products for referral code (public)
router.get('/catalog/referral/:referralCode/products', getReferralProducts);

export default router;