import { Router } from 'express';
import {
  configureOrderFields,
  createOrder,
  updateOrderItemStatus,
  getOrderById,
  cancelOrder,
  getOrders,
  updateOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStatusHistory,
  getStatusOptions,
  generateInvoice,
} from '../controller/ShopOrderController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.get('/shops/:shopId/orders', authMiddleware, getOrders);
router.post('/shops/:shopId/orders/configure-fields', authMiddleware, configureOrderFields);
router.post('/shops/:shopId/orders', authMiddleware, createOrder);

// Order item status
router.put('/order-items/:orderItemId/status', authMiddleware, updateOrderItemStatus);

// Order operations
router.get('/orders/:orderId', authMiddleware, getOrderById);
router.put('/orders/:orderId', authMiddleware, updateOrder);
router.put('/orders/:orderId/cancel', authMiddleware, cancelOrder);

// New status management endpoints
router.put('/orders/:orderId/status', authMiddleware, updateOrderStatus);
router.put('/orders/:orderId/payment-status', authMiddleware, updatePaymentStatus);
router.get('/orders/:orderId/status-history', authMiddleware, getOrderStatusHistory);
router.get('/orders/:orderId/status-options', authMiddleware, getStatusOptions);

// Invoice endpoint
router.get('/orders/:orderId/invoice', authMiddleware, generateInvoice);

export default router;
