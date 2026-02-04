import { Router } from 'express';
import {
  createInventoryTransaction,
  getShopInventoryTransactions,
  getProductInventoryTransactions,
  getInventoryTransactionById,
} from '../controller/InvectoryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.post('/shops/:shopId/inventory/transactions', authMiddleware, createInventoryTransaction);
router.get('/shops/:shopId/inventory/transactions', authMiddleware, getShopInventoryTransactions);
router.get('/products/:productId/inventory/transactions', authMiddleware, getProductInventoryTransactions);
router.get('/inventory/transactions/:transactionId', authMiddleware, getInventoryTransactionById);

export default router;
