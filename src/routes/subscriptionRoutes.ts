import express, { Router, Request, Response } from 'express';
import { Subscription, Plan, PaymentRecord, Shop } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router: Router = express.Router();

// ======================
// PLAN MANAGEMENT
// ======================

// Get all plans
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  const plans = await Plan.findAll({
    where: { isActive: true },
    order: [['monthlyPrice', 'ASC']]
  });

  res.json(plans);
}));

// Get plan details
router.get('/plans/:planId', asyncHandler(async (req: Request, res: Response) => {
  const planId = parseInt(req.params.planId);
  const plan = await Plan.findByPk(planId);

  if (!plan) throw new ApiError('Plan not found', 404);
  res.json(plan);
}));

// ======================
// SUBSCRIPTION MANAGEMENT
// ======================

// Get shop subscription
router.get('/my-subscription', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  
  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  const subscription = await Subscription.findOne({
    where: { shopId: shop.id },
    include: [{ association: 'plan' }, { association: 'payments' }]
  });

  if (!subscription) throw new ApiError('Subscription not found', 404);
  res.json(subscription);
}));

// Select a plan
router.post('/select-plan', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const { planId, billingCycle = 'monthly' } = req.body;

  if (!planId) throw new ApiError('Plan ID required', 400);

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  // Check if plan exists
  const plan = await Plan.findByPk(planId);
  if (!plan) throw new ApiError('Plan not found', 404);

  // Calculate renewal date
  const renewalDate = new Date();
  if (billingCycle === 'monthly') {
    renewalDate.setMonth(renewalDate.getMonth() + 1);
  } else {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  }

  // Check if shop has existing subscription
  let subscription = await Subscription.findOne({ where: { shopId: shop.id } });

  if (subscription) {
    // Update existing subscription
    await subscription.update({
      planId,
      billingCycle,
      renewalDate,
      status: 'active',
      autoRenew: true,
      isPaymentPending: true,
      nextPaymentDate: new Date()
    });
  } else {
    // Create new subscription
    subscription = await Subscription.create({
      shopId: shop.id,
      planId,
      billingCycle,
      startDate: new Date(),
      renewalDate,
      status: 'active',
      autoRenew: true,
      isPaymentPending: true,
      nextPaymentDate: new Date(),
      currentUsage: {}
    } as any);
  }

  res.status(201).json({ 
    message: 'Plan selected successfully', 
    subscription,
    nextPayment: {
      amount: billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
      dueDate: new Date()
    }
  });
}));

// Get subscription billing history
router.get('/billing-history', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const { page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  const { count, rows } = await PaymentRecord.findAndCountAll({
    where: { shopId: shop.id },
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

// Record payment (after successful payment from payment gateway)
router.post('/record-payment', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const { 
    amount, 
    transactionId, 
    paymentMethod = 'card', 
    paymentGateway = 'stripe',
    invoiceUrl
  } = req.body;

  if (!amount || !transactionId) throw new ApiError('Amount and transaction ID required', 400);

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  const subscription = await Subscription.findOne({ where: { shopId: shop.id } });
  if (!subscription) throw new ApiError('Subscription not found', 404);

  const plan = await Plan.findByPk(subscription.planId);
  if (!plan) throw new ApiError('Plan not found', 404);

  // Create payment record
  const payment = await PaymentRecord.create({
    subscriptionId: subscription.id,
    shopId: shop.id,
    planId: plan.id,
    amount,
    billingCycle: subscription.billingCycle,
    paymentMethod,
    paymentGateway,
    transactionId,
    status: 'completed',
    invoiceUrl,
    paidAt: new Date()
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

  // Activate shop if it was suspended due to non-payment
  if (shop.isBlocked && shop.blockReason?.includes('Non-payment')) {
    await shop.update({ isBlocked: false, blockReason: undefined, isActive: true });
  }

  res.json({ message: 'Payment recorded successfully', payment, subscription });
}));

// Download invoice
router.get('/invoices/:paymentId', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;
  const paymentId = parseInt(req.params.paymentId);

  // Verify payment belongs to user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  const payment = await PaymentRecord.findOne({
    where: { id: paymentId, shopId: shop.id }
  });

  if (!payment) throw new ApiError('Payment not found', 404);
  if (!payment.invoiceUrl) throw new ApiError('Invoice not available', 404);

  res.json({ invoiceUrl: payment.invoiceUrl });
}));

// ======================
// FEATURE LIMITS & USAGE
// ======================

// Get feature limits and current usage
router.get('/usage', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req as any).userId as any;

  // Get user's shop
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new ApiError('Shop not found', 404);

  const subscription = await Subscription.findOne({
    where: { shopId: shop.id },
    include: [{ association: 'plan' }]
  });

  if (!subscription) throw new ApiError('Subscription not found', 404);

  const plan: any = subscription.plan;

  // Get current usage
  const { Product, Order, Employee } = require('../models');
  
  const [productCount, orderCount, employeeCount] = await Promise.all([
    Product.count({ where: { shopId: shop.id } }),
    Order.count({ where: { shopId: shop.id } }),
    Employee.count({ where: { shopId: shop.id } })
  ]);

  res.json({
    plan: {
      name: plan.name,
      features: plan.features
    },
    limits: {
      productCountLimit: plan.productCountLimit,
      orderCountLimit: plan.orderCountLimit,
      employeeCountLimit: plan.employeeCountLimit,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
      hasAPIAccess: plan.hasAPIAccess,
      hasCustomDomain: plan.hasCustomDomain,
      hasPaymentGateway: plan.hasPaymentGateway
    },
    usage: {
      products: productCount,
      orders: orderCount,
      employees: employeeCount
    },
    percentageUsed: {
      products: ((productCount / plan.productCountLimit) * 100).toFixed(2),
      orders: ((orderCount / plan.orderCountLimit) * 100).toFixed(2),
      employees: ((employeeCount / plan.employeeCountLimit) * 100).toFixed(2)
    }
  });
}));

// ======================
// AUTO-DISABLE ON NON-PAYMENT (Cron Job Endpoint)
// ======================

// Check and disable non-paying subscriptions (should be called by cron job)
router.post('/check-payment-status', asyncHandler(async (req: Request, res: Response) => {
  // This endpoint should be protected by a secret key in production
  const secretKey = req.headers['x-api-key'];
  if (secretKey !== process.env.CRON_SECRET_KEY) {
    throw new ApiError('Unauthorized', 401);
  }

  const today = new Date();
  const overdueSubscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      nextPaymentDate: { [Op.lt]: today },
      isPaymentPending: true
    },
    include: [{ association: 'shop' }]
  });

  let disabledCount = 0;
  for (const sub of overdueSubscriptions) {
    // Check if payment is really pending
    const daysSinceDue = Math.floor((today.getTime() - new Date(sub.nextPaymentDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDue >= 7) { // Disable after 7 days of non-payment
      const shop: any = sub.shop;
      
      await sub.update({ status: 'suspended' });
      await shop.update({
        isActive: false,
        isBlocked: true,
        blockReason: 'Non-payment: Subscription suspended'
      });

      disabledCount++;
    }
  }

  res.json({ message: `${disabledCount} subscriptions disabled due to non-payment` });
}));

export default router;
