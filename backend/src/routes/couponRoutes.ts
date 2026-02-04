import { Router } from 'express';
import {
  createCoupon,
  getShopCoupons,
  validateCoupon,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
  generateCouponCode,
  getCouponStats
} from '../controller/CouponController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Create coupon
router.post('/coupons', authMiddleware, createCoupon);

// Get shop coupons
router.get('/shops/:shopId/coupons', authMiddleware, getShopCoupons);

// Validate coupon (can be public for catalog access)
router.post('/coupons/validate', validateCoupon);

// Apply coupon (increment usage)
router.post('/coupons/apply', authMiddleware, applyCoupon);

// Update coupon
router.put('/coupons/:couponId', authMiddleware, updateCoupon);

// Delete coupon
router.delete('/coupons/:couponId', authMiddleware, deleteCoupon);

// Generate coupon code
router.post('/coupons/generate-code', authMiddleware, generateCouponCode);

// Get coupon statistics
router.get('/shops/:shopId/coupons/stats', authMiddleware, getCouponStats);

export default router;