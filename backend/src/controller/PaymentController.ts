import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Op } from 'sequelize';

import Payment, { PaymentStatus, PaymentMethod } from '../models/Payment';
import Order, { PaymentStatus as OrderPaymentStatus } from '../models/ShopOrder';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import Employee from '../models/Employee';

import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* =====================================================
   RAZORPAY CONFIGURATION
===================================================== */

// Initialize Razorpay with API keys from environment
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret',
});

/* =====================================================
   TYPES
===================================================== */

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
  params: {
    shopId?: string;
    paymentId?: string;
    orderId?: string;
  };
}

interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  upiId?: string;
  email?: string;
  contact?: string;
  description?: string;
}

/* =====================================================
   HELPERS
===================================================== */

const verifyShopAccess = async (userId: string, shopId: string) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  // First, look up the ShopOwner by userId to get the correct ownerId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  
  // Check if user is the shop owner (compare shopOwner.ownerId with shop.ownerId)
  if (shopOwner && shop.ownerId === shopOwner.ownerId) {
    return shop;
  }

  // Check if user is an active employee of the shop
  const employee = await Employee.findOne({
    where: {
      userId: userId,
      shopId: shopId,
      isActive: true
    }
  });

  if (!employee) {
    throw new ApiError(403, 'Unauthorized - not a shop owner or active employee');
  }

  return shop;
};

const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: OrderPaymentStatus,
  paidAmount?: number
) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  let balanceAmount = order.totalAmount;

  if (paidAmount !== undefined) {
    const newPaidAmount = (order.paidAmount || 0) + paidAmount;
    balanceAmount = order.totalAmount - newPaidAmount;
    
    await order.update({
      paymentStatus,
      paidAmount: newPaidAmount,
      balanceAmount: balanceAmount > 0 ? balanceAmount : 0,
    });
  } else {
    await order.update({ paymentStatus });
  }

  return order;
};

/* =====================================================
   CREATE PAYMENT ORDER
   Creates a Razorpay order for payment
===================================================== */

export const createPaymentOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  const { orderId, amount, currency = 'INR', description }: CreatePaymentInput = req.body;

  if (!userId || !shopId) throw new ApiError(401, 'Unauthorized');
  if (!orderId || !amount || amount <= 0) throw new ApiError(400, 'Invalid payment data');

  // Verify shop access
  await verifyShopAccess(userId, shopId);

  // Verify order exists and belongs to shop
  const order = await Order.findOne({
    where: { orderId, shopId },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  // Generate unique receipt
  const receipt = `rcpt_${orderId.slice(0, 8)}_${Date.now()}`;

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt,
    notes: {
      orderId,
      shopId,
      orderNumber: order.orderNumber,
    },
  });

  // Create payment record in database
  const payment = await Payment.create({
    orderId,
    shopId,
    razorpayOrderId: razorpayOrder.id,
    amount,
    currency,
    status: 'CREATED',
    description: description || `Payment for Order #${order.orderNumber}`,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        paymentId: payment.paymentId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
      'Payment order created',
    ),
  );
});

/* =====================================================
   VERIFY PAYMENT
   Verifies the payment signature from Razorpay
===================================================== */

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!userId || !shopId) throw new ApiError(401, 'Unauthorized');
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Missing payment verification data');
  }

  // Find payment record
  const payment = await Payment.findOne({
    where: { razorpayOrderId },
  });

  if (!payment) throw new ApiError(404, 'Payment not found');

  // Verify shop access
  await verifyShopAccess(userId, payment.shopId);

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    // Mark payment as failed
    await payment.update({ status: 'FAILED' });
    throw new ApiError(400, 'Invalid payment signature');
  }

  // Get payment details from Razorpay
  const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

  // Update payment record
  await payment.update({
    razorpayPaymentId,
    razorpaySignature,
    status: 'CAPTURED',
    paymentMethod: razorpayPayment.method?.toUpperCase() as PaymentMethod,
    email: razorpayPayment.email ?? undefined,
    contact: razorpayPayment.contact ? String(razorpayPayment.contact) : undefined,
    upiId: razorpayPayment.vpa ?? undefined,
    cardLast4: razorpayPayment.card?.last4 ?? undefined,
    bank: razorpayPayment.bank ?? undefined,
    wallet: razorpayPayment.wallet ?? undefined,
    notes: razorpayPayment.notes,
  });

  // Update order payment status
  await updateOrderPaymentStatus(payment.orderId, 'PAID', payment.amount);

  res.json(
    new ApiResponse(
      200,
      {
        paymentId: payment.paymentId,
        status: 'CAPTURED',
        orderId: payment.orderId,
      },
      'Payment verified successfully',
    ),
  );
});

/* =====================================================
   GET PAYMENT BY ID
===================================================== */

export const getPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentId } = req.params;
  const userId = req.user?.userId;

  if (!paymentId || !userId) throw new ApiError(400, 'Invalid request');

  const payment = await Payment.findByPk(paymentId, {
    include: [
      { model: Order, as: 'order' },
      { model: Shop, as: 'shop' },
    ],
  });

  if (!payment) throw new ApiError(404, 'Payment not found');

  // Verify shop access
  await verifyShopAccess(userId, payment.shopId);

  res.json(new ApiResponse(200, payment, 'Payment fetched'));
});

/* =====================================================
   GET PAYMENTS BY ORDER
===================================================== */

export const getPaymentsByOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');

  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  // Verify shop access
  await verifyShopAccess(userId, order.shopId);

  const payments = await Payment.findAll({
    where: { orderId },
    order: [['createdAt', 'DESC']],
  });

  res.json(new ApiResponse(200, payments, 'Payments fetched'));
});

/* =====================================================
   PROCESS REFUND
===================================================== */

export const processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentId } = req.params;
  const userId = req.user?.userId;
  const { amount, reason } = req.body;

  if (!paymentId || !userId) throw new ApiError(400, 'Invalid request');

  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');

  // Verify shop access
  await verifyShopAccess(userId, payment.shopId);

  if (payment.status !== 'CAPTURED') {
    throw new ApiError(400, 'Only captured payments can be refunded');
  }

  const refundAmount = amount || payment.amount;

  if (refundAmount > payment.amount - (payment.refundedAmount || 0)) {
    throw new ApiError(400, 'Refund amount exceeds remaining payment');
  }

  // Process refund via Razorpay
  const refund = await razorpay.payments.refund(payment.razorpayPaymentId!, {
    amount: Math.round(refundAmount * 100),
    notes: { reason: reason || 'Customer refund' },
  });

  // Update payment record
  const newRefundedAmount = (payment.refundedAmount || 0) + refundAmount;
  const newStatus = newRefundedAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

  await payment.update({
    refundedAmount: newRefundedAmount,
    refundId: refund.id,
    status: newStatus,
  });

  // Update order payment status
  if (newStatus === 'REFUNDED') {
    await updateOrderPaymentStatus(payment.orderId, 'UNPAID');
  }

  res.json(
    new ApiResponse(
      200,
      {
        paymentId: payment.paymentId,
        refundId: refund.id,
        refundedAmount: refundAmount,
        status: newStatus,
      },
      'Refund processed successfully',
    ),
  );
});

/* =====================================================
   GET SHOP PAYMENTS
   Get all payments for a shop
===================================================== */

export const getShopPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

  if (!userId || !shopId) throw new ApiError(400, 'Invalid request');

  // Verify shop access
  await verifyShopAccess(userId, shopId);

  // Build where clause
  const where: any = { shopId };

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: payments } = await Payment.findAndCountAll({
    where,
    include: [{ model: Order, as: 'order', attributes: ['orderNumber', 'totalAmount'] }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  res.json(
    new ApiResponse(
      200,
      {
        payments,
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
      },
      'Payments fetched',
    ),
  );
});

/* =====================================================
   CREATE UPI COLLECT REQUEST
   Creates a UPI collect request for payment
===================================================== */

export const createUPICollect = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  const { orderId, amount, upiId, description }: CreatePaymentInput & { upiId: string } = req.body;

  if (!userId || !shopId) throw new ApiError(401, 'Unauthorized');
  if (!orderId || !amount || !upiId) throw new ApiError(400, 'Invalid payment data');

  // Verify shop access
  await verifyShopAccess(userId, shopId);

  // Verify order exists
  const order = await Order.findOne({
    where: { orderId, shopId },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  // Create payment record with UPI details
  const payment = await Payment.create({
    orderId,
    shopId,
    amount,
    currency: 'INR',
    status: 'PENDING',
    upiId,
    description: description || `UPI Payment for Order #${order.orderNumber}`,
  });

  // Note: UPI collect requires additional setup with Razorpay
  // This is a simplified version - in production you'd use their UPI specific API

  res.status(201).json(
    new ApiResponse(
      201,
      {
        paymentId: payment.paymentId,
        upiId,
        amount,
        orderNumber: order.orderNumber,
        // In production, you'd get a collect request link from Razorpay
        upiDeepLink: `upi://pay?pa=${upiId}&pn=ApnaVyapar&tn=${payment.paymentId}&am=${amount}`,
      },
      'UPI collect initiated',
    ),
  );
});

/* =====================================================
   WEBHOOK HANDLER
   Handles Razorpay webhook events
===================================================== */

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'] as string;

  // Verify webhook signature
  if (webhookSecret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new ApiError(400, 'Invalid webhook signature');
    }
  }

  const event = req.body;
  const { event: eventType, payload } = event;

  switch (eventType) {
    case 'payment.captured': {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;

      const payment = await Payment.findOne({
        where: { razorpayOrderId },
      });

      if (payment && payment.status !== 'CAPTURED') {
        await payment.update({
          razorpayPaymentId: paymentEntity.id,
          status: 'CAPTURED',
          paymentMethod: paymentEntity.method?.toUpperCase() as PaymentMethod,
          email: paymentEntity.email ?? undefined,
          contact: paymentEntity.contact ? String(paymentEntity.contact) : undefined,
          webhookData: payload,
        });

        await updateOrderPaymentStatus(payment.orderId, 'PAID', payment.amount);
      }
      break;
    }

    case 'payment.failed': {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;

      const payment = await Payment.findOne({
        where: { razorpayOrderId },
      });

      if (payment) {
        await payment.update({
          razorpayPaymentId: paymentEntity.id,
          status: 'FAILED',
          webhookData: payload,
        });
      }
      break;
    }

    case 'refund.processed': {
      const refundEntity = payload.refund.entity;
      const razorpayPaymentId = refundEntity.payment_id;

      const payment = await Payment.findOne({
        where: { razorpayPaymentId },
      });

      if (payment) {
        const refundAmount = refundEntity.amount / 100;
        const newRefundedAmount = (payment.refundedAmount || 0) + refundAmount;

        await payment.update({
          refundedAmount: newRefundedAmount,
          refundId: refundEntity.id,
          status: newRefundedAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          webhookData: payload,
        });
      }
      break;
    }

    default:
      console.log(`Unhandled webhook event: ${eventType}`);
  }

  res.json({ status: 'ok' });
});

/* =====================================================
   GENERATE PAYMENT LINK
   Generate a payment link for customer
===================================================== */

export const generatePaymentLink = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  const { orderId, amount, description, customerName, customerEmail, customerMobile } = req.body;

  if (!userId || !shopId) throw new ApiError(401, 'Unauthorized');
  if (!orderId || !amount) throw new ApiError(400, 'Invalid payment data');

  // Verify shop access
  await verifyShopAccess(userId, shopId);

  // Verify order exists
  const order = await Order.findOne({
    where: { orderId, shopId },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  // Generate payment link via Razorpay
  const paymentLink = await razorpay.paymentLink.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    description: description || `Payment for Order #${order.orderNumber}`,
    customer: {
      name: customerName,
      email: customerEmail,
      contact: customerMobile,
    },
    notify: {
      sms: true,
      email: true,
    },
    callback_url: `${process.env.FRONTEND_URL}/orders/${orderId}/payment-callback`,
    callback_method: 'get',
  });

  // Create payment record
  const payment = await Payment.create({
    orderId,
    shopId,
    razorpayOrderId: paymentLink.id,
    amount,
    currency: 'INR',
    status: 'PENDING',
    email: customerEmail,
    contact: customerMobile,
    description: description || `Payment for Order #${order.orderNumber}`,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        paymentId: payment.paymentId,
        paymentLinkId: paymentLink.id,
        shortUrl: paymentLink.short_url,
        paymentLinkUrl: (paymentLink as any).url || paymentLink.short_url,
      },
      'Payment link generated',
    ),
  );
});

/* =====================================================
   GET PAYMENT STATS
   Get payment statistics for a shop
===================================================== */

export const getPaymentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  const { startDate, endDate } = req.query;

  if (!userId || !shopId) throw new ApiError(400, 'Invalid request');

  // Verify shop access
  await verifyShopAccess(userId, shopId);

  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter[Op.gte] = new Date(startDate as string);
  if (endDate) dateFilter[Op.lte] = new Date(endDate as string);

  // Get totals
  const totalReceived = await Payment.sum('amount', {
    where: {
      shopId,
      status: 'CAPTURED',
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  const totalRefunded = await Payment.sum('refundedAmount', {
    where: {
      shopId,
      status: { [Op.in]: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  const pendingPayments = await Payment.count({
    where: {
      shopId,
      status: { [Op.in]: ['PENDING', 'CREATED'] },
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  const failedPayments = await Payment.count({
    where: {
      shopId,
      status: 'FAILED',
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
  });

  // Get payment method breakdown
  const paymentMethodStats = await Payment.findAll({
    where: {
      shopId,
      status: 'CAPTURED',
      ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
    },
    attributes: [
      'paymentMethod',
      [require('sequelize').fn('COUNT', require('sequelize').col('paymentMethod')), 'count'],
      [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
    ],
    group: ['paymentMethod'],
    raw: true,
  });

  res.json(
    new ApiResponse(
      200,
      {
        totalReceived: totalReceived || 0,
        totalRefunded: totalRefunded || 0,
        netRevenue: (totalReceived || 0) - (totalRefunded || 0),
        pendingPayments,
        failedPayments,
        paymentMethodStats,
      },
      'Payment statistics fetched',
    ),
  );
});

