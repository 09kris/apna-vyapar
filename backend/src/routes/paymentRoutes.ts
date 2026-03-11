import { Router, Request, Response } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentById,
  getPaymentsByOrder,
  processRefund,
  getShopPayments,
  createUPICollect,
  generatePaymentLink,
  getPaymentStats,
  handleWebhook,
} from '../controller/PaymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Webhook endpoint (no auth - Razorpay will call this)
router.post('/payments/webhook', handleWebhook);

// All other routes require authentication
router.use(authMiddleware);

// Create a new payment order
router.post('/shops/:shopId/payments/create-order', createPaymentOrder);

// Verify payment
router.post('/shops/:shopId/payments/verify', verifyPayment);

// Get payment by ID
router.get('/shops/:shopId/payments/:paymentId', getPaymentById);

// Get payments by order
router.get('/orders/:orderId/payments', getPaymentsByOrder);

// Process refund
router.post('/shops/:shopId/payments/:paymentId/refund', processRefund);

// Get all payments for a shop
router.get('/shops/:shopId/payments', getShopPayments);

// Create UPI collect
router.post('/shops/:shopId/payments/upi-collect', createUPICollect);

// Generate payment link
router.post('/shops/:shopId/payments/payment-link', generatePaymentLink);

// Get payment statistics
router.get('/shops/:shopId/payments/stats', getPaymentStats);

export default router;

