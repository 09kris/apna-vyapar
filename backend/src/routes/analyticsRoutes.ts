import { Router } from 'express';
import {
  getDashboardOverview,
  getSalesAnalytics,
  getProductPerformance,
  getCustomerAnalytics,
  getInventoryAnalytics,
  getFinancialSummary
} from '../controller/AnalyticsController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Dashboard overview
router.get('/shops/:shopId/analytics/dashboard', authMiddleware, getDashboardOverview);

// Sales analytics
router.get('/shops/:shopId/analytics/sales', authMiddleware, getSalesAnalytics);

// Product performance
router.get('/shops/:shopId/analytics/products', authMiddleware, getProductPerformance);

// Customer analytics
router.get('/shops/:shopId/analytics/customers', authMiddleware, getCustomerAnalytics);

// Inventory analytics
router.get('/shops/:shopId/analytics/inventory', authMiddleware, getInventoryAnalytics);

// Financial summary
router.get('/shops/:shopId/analytics/financial', authMiddleware, getFinancialSummary);

export default router;