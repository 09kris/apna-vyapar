import { Router } from 'express';
import {
  configureOrderFields,
  createOrder,
  updateOrderItemStatus,
  getOrderById,
  cancelOrder,
} from '../controller/ShopOrderController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.post('/shops/:shopId/orders/configure-fields', authMiddleware, configureOrderFields);
router.post('/shops/:shopId/orders', authMiddleware, createOrder);
router.put('/order-items/:orderItemId/status', authMiddleware, updateOrderItemStatus);
router.get('/orders/:orderId', authMiddleware, getOrderById);
router.put('/orders/:orderId/cancel', authMiddleware, cancelOrder);

export default router;
