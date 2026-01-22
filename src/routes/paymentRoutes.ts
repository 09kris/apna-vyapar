import express, { Router, Request, Response } from 'express';
import { Subscription, PaymentRecord, Plan, Shop } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// In production, you would initialize Razorpay or Stripe SDKs here
// const Razorpay = require('razorpay');
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// ======================
// RAZORPAY INTEGRATION
// ======================

// Create Razorpay order for payment
router.post('/razorpay/create-order', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const { planId, billingCycle = 'monthly' } = req.body;

  if (!planId) throw new ApiError('Plan ID required', 400);

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  // Get plan
  const plan = await Plan.findByPk(planId);
  if (!plan) throw new ApiError('Plan not found', 404);

  // Calculate amount based on billing cycle
  const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

  // In production, create actual Razorpay order
  // const order = await razorpay.orders.create({
  //   amount: Math.round(amount * 100), // Convert to paise
  //   currency: 'INR',
  //   receipt: `order_${shop.id}_${Date.now()}`
  // });

  // For demo, create a mock order
  const order = {
    id: `order_${shop.id}_${Date.now()}`,
    amount: Math.round(amount * 100),
    currency: 'INR',
    status: 'created'
  };

  res.json({
    order,
    key: process.env.RAZORPAY_KEY_ID,
    shop: { id: shop.id, name: shop.shopName, email: shop.email },
    plan: { id: plan.id, name: plan.name },
    amount,
    billingCycle
  });
}));

// Razorpay webhook to verify payment
router.post('/razorpay/webhook', asyncHandler(async (req: Request, res: Response) => {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify webhook signature
  const shasum = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
  if (shasum !== req.headers['x-razorpay-signature']) {
    throw new ApiError('Invalid signature', 401);
  }

  const { event, payload } = req.body;

  if (event === 'payment.authorized') {
    const { payment, order } = payload;

    // Extract shop ID from order receipt
    const shopId = parseInt(order.receipt.split('_')[1]);

    // Record payment
    const subscription = await Subscription.findOne({ where: { shopId } });
    if (!subscription) throw new ApiError('Subscription not found', 404);

    const plan = await Plan.findByPk(subscription.planId);
    if (!plan) throw new ApiError('Plan not found', 404);

    await PaymentRecord.create({
      subscriptionId: subscription.id,
      shopId,
      planId: plan.id,
      amount: payment.amount / 100, // Convert from paise
      billingCycle: order.receipt.includes('monthly') ? 'monthly' : 'yearly',
      paymentMethod: 'card',
      paymentGateway: 'razorpay',
      transactionId: payment.id,
      status: 'completed',
      paidAt: new Date(payment.created_at * 1000)
    } as any);

    // Update subscription
    const nextRenewalDate = new Date();
    if (subscription.billingCycle === 'monthly') {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
    } else {
      nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
    }

    await subscription.update({
      lastPaymentDate: new Date(),
      nextPaymentDate: nextRenewalDate,
      isPaymentPending: false,
      status: 'active'
    });

    // Reactivate shop if suspended
    const shop = await Shop.findByPk(shopId);
    if (shop?.isBlocked) {
      await shop.update({ isBlocked: false, isActive: true });
    }
  }

  res.json({ status: 'ok' });
}));

// ======================
// STRIPE INTEGRATION
// ======================

// Create Stripe payment intent
router.post('/stripe/create-payment-intent', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const { planId, billingCycle = 'monthly' } = req.body;

  if (!planId) throw new ApiError('Plan ID required', 400);

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  // Get plan
  const plan = await Plan.findByPk(planId);
  if (!plan) throw new ApiError('Plan not found', 404);

  // Calculate amount
  const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

  // In production, create actual Stripe payment intent
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: Math.round(amount * 100), // Convert to cents
  //   currency: 'usd',
  //   description: `${plan.name} - ${billingCycle}`,
  //   metadata: {
  //     shopId: shop.id,
  //     planId: plan.id,
  //     billingCycle
  //   }
  // });

  // For demo
  const paymentIntent = {
    id: `pi_${Date.now()}`,
    client_secret: `pi_${Date.now()}_secret_${Math.random()}`,
    amount: Math.round(amount * 100),
    status: 'requires_payment_method'
  };

  res.json({
    clientSecret: paymentIntent.client_secret,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    shop: { id: shop.id, name: shop.shopName, email: shop.email },
    plan: { id: plan.id, name: plan.name },
    amount,
    billingCycle
  });
}));

// Stripe webhook
router.post('/stripe/webhook', asyncHandler(async (req: Request, res: Response) => {
  const crypto = require('crypto');
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  let event;
  try {
    // Verify webhook signature
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new ApiError('Webhook signature verification failed', 400);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { shopId, planId, billingCycle } = paymentIntent.metadata;

    // Record payment
    const subscription = await Subscription.findOne({ where: { shopId } });
    if (!subscription) throw new ApiError('Subscription not found', 404);

    const plan = await Plan.findByPk(planId);
    if (!plan) throw new ApiError('Plan not found', 404);

    await PaymentRecord.create({
      subscriptionId: subscription.id,
      shopId,
      planId,
      amount: paymentIntent.amount / 100, // Convert from cents
      billingCycle,
      paymentMethod: 'card',
      paymentGateway: 'stripe',
      transactionId: paymentIntent.id,
      status: 'completed',
      paidAt: new Date()
    } as any);

    // Update subscription
    const nextRenewalDate = new Date();
    if (billingCycle === 'monthly') {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
    } else {
      nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
    }

    await subscription.update({
      lastPaymentDate: new Date(),
      nextPaymentDate: nextRenewalDate,
      isPaymentPending: false,
      status: 'active'
    });

    // Reactivate shop if suspended
    const shop = await Shop.findByPk(shopId);
    if (shop?.isBlocked) {
      await shop.update({ isBlocked: false, isActive: true });
    }
  }

  res.json({ received: true });
}));

// ======================
// PAYMENT HISTORY
// ======================

// Get payment history with invoices
router.get('/history', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const { page = '1', limit = '20', status } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  const where: any = { shopId: shop.id };
  if (status) where.status = status;

  const { count, rows } = await PaymentRecord.findAndCountAll({
    where,
    include: [{ association: 'plan' }],
    offset,
    limit: limitNum,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
  });
}));

// Get invoice details
router.get('/invoice/:paymentId', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const paymentId = parseInt(req.params.paymentId);

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  const payment = await PaymentRecord.findOne({
    where: { id: paymentId, shopId: shop.id },
    include: [
      { association: 'plan' },
      { association: 'subscription', include: [{ association: 'shop' }] }
    ]
  });

  if (!payment) throw new ApiError('Payment not found', 404);

  // Generate invoice data
  const invoiceData = {
    invoiceNumber: `INV-${payment.id}-${payment.createdAt?.getTime()}`,
    date: payment.createdAt,
    dueDate: payment.paidAt,
    shop: {
      name: shop.shopName,
      email: shop.email,
      phone: shop.phone
    },
    plan: (payment as any).plan,
    amount: payment.amount,
    billingCycle: payment.billingCycle,
    paymentMethod: payment.paymentMethod,
    transactionId: payment.transactionId,
    status: payment.status
  };

  res.json(invoiceData);
}));

// Generate and download invoice PDF
router.get('/invoice/:paymentId/download', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const paymentId = parseInt(req.params.paymentId);

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  const payment = await PaymentRecord.findOne({
    where: { id: paymentId, shopId: shop.id }
  });

  if (!payment) throw new ApiError('Payment not found', 404);

  // In production, generate PDF using library like pdfkit or puppeteer
  // For now, return JSON
  const invoiceUrl = `/invoices/${payment.id}.pdf`;

  res.json({ 
    message: 'Invoice download link',
    invoiceUrl,
    filename: `invoice-${payment.id}.pdf`
  });
}));

export default router;
