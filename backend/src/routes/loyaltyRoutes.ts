import { Router } from 'express';
import {
  getLoyaltyBalance,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  calculateOrderPoints,
  getLoyaltyStats
} from '../controller/LoyaltyController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Get customer loyalty balance
router.get('/customers/:customerId/loyalty/balance', authMiddleware, getLoyaltyBalance);

// Add loyalty points
router.post('/loyalty/points/add', authMiddleware, addLoyaltyPoints);

// Redeem loyalty points
router.post('/loyalty/points/redeem', authMiddleware, redeemLoyaltyPoints);

// Calculate points for order
router.post('/loyalty/points/calculate', authMiddleware, calculateOrderPoints);

// Get loyalty program statistics
router.get('/shops/:shopId/loyalty/stats', authMiddleware, getLoyaltyStats);

export default router;