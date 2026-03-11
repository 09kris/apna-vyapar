import { Router } from 'express';
import {
  createAccountingEntry,
  getAccountingEntries,
  getAccountingById,
  updateAccountingEntry,
  deleteAccountingEntry,
  getAccountingSummary,
  getAccountingDashboard,
  bulkCreateAccounting
} from '../controller/AccountingController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication and SHOP_OWNER role only
router.use(authMiddleware);
router.use(roleMiddleware(['SHOP_OWNER']));

// Dashboard and summary routes
router.get('/shops/:shopId/accounting/dashboard', getAccountingDashboard);
router.get('/shops/:shopId/accounting/summary', getAccountingSummary);

// CRUD operations
router.post('/shops/:shopId/accounting', createAccountingEntry);
router.get('/shops/:shopId/accounting', getAccountingEntries);
router.post('/shops/:shopId/accounting/bulk', bulkCreateAccounting);
router.get('/accounting/:accountingId', getAccountingById);
router.put('/accounting/:accountingId', updateAccountingEntry);
router.delete('/accounting/:accountingId', deleteAccountingEntry);

export default router;

