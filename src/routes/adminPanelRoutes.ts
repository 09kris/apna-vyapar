import express, { Router, Request, Response } from 'express';
import { Shop, Subscription, Plan, KYCVerification, AbuseReport, AdminLog, User, PaymentRecord } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router: Router = express.Router();

// Middleware to verify super admin
const verifySuperAdmin = (req: AuthRequest, res: Response, next: any) => {
  if ((req as any).userRole !== 'super_admin' && (req as any).userRole !== 'platform_admin') {
    return res.status(403).json({ error: 'Only super admins can access this resource' });
  }
  next();
};

// ======================
// SHOP MANAGEMENT
// ======================

// Get all shops with filters
router.get('/shops', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, kycStatus, isBlocked, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  const filter: any = {};
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (kycStatus) filter.kycStatus = kycStatus;
  if (isBlocked === 'true') filter.isBlocked = true;

  const { count, rows } = await Shop.findAndCountAll({
    where: filter,
    include: [{ association: 'subscription' }, { association: 'kyc' }],
    offset,
    limit: limitNum,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
  });
}));

// Approve shop
router.patch('/shops/:shopId/approve', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shopId = parseInt(req.params.shopId);
  const shop = await Shop.findByPk(shopId);

  if (!shop) throw new ApiError('Shop not found', 404);

  await shop.update({ isVerified: true, kycStatus: 'approved' });

  // Log action
  await AdminLog.create({
    adminId: (req as any).adminId || 0,
    action: 'shop_approved',
    entityType: 'shop',
    entityId: shopId,
    changes: JSON.stringify({ isVerified: true, kycStatus: 'approved' })
  } as any);

  res.json({ message: 'Shop approved successfully', shop });
}));

// Block shop
router.patch('/shops/:shopId/block', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shopId = parseInt(req.params.shopId);
  const { blockReason } = req.body;

  if (!blockReason) throw new ApiError('Block reason required', 400);

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError('Shop not found', 404);

  await shop.update({ 
    isBlocked: true, 
    blockReason, 
    blockedAt: new Date(),
    isActive: false 
  });

  // Log action
  await AdminLog.create({
    adminId: (req as any).adminId || 0,
    action: 'shop_blocked',
    entityType: 'shop',
    entityId: shopId,
    changes: JSON.stringify({ isBlocked: true, blockReason, isActive: false })
  } as any);

  res.json({ message: 'Shop blocked successfully', shop });
}));

// Unblock shop
router.patch('/shops/:shopId/unblock', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shopId = parseInt(req.params.shopId);
  const shop = await Shop.findByPk(shopId);

  if (!shop) throw new ApiError('Shop not found', 404);

  await shop.update({ 
    isBlocked: false, 
    blockReason: undefined, 
    blockedAt: undefined,
    isActive: true 
  });

  await AdminLog.create({
    adminId: (req as any).adminId || 0,
    action: 'shop_unblocked',
    entityType: 'shop',
    entityId: shopId,
    changes: JSON.stringify({ isBlocked: false, isActive: true })
  } as any);

  res.json({ message: 'Shop unblocked successfully', shop });
}));

// ======================
// SUBSCRIPTION MANAGEMENT
// ======================

// Get all subscriptions
router.get('/subscriptions', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, planId, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  const filter: any = {};
  if (status) filter.status = status;
  if (planId) filter.planId = parseInt(planId as string);

  const { count, rows } = await Subscription.findAndCountAll({
    where: filter,
    include: [{ association: 'shop' }, { association: 'plan' }],
    offset,
    limit: limitNum,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
  });
}));

// Suspend subscription
router.patch('/subscriptions/:subId/suspend', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const subId = parseInt(req.params.subId);
  const { reason } = req.body;

  const subscription = await Subscription.findByPk(subId);
  if (!subscription) throw new ApiError('Subscription not found', 404);

  await subscription.update({ status: 'suspended' });

  const shop = await Shop.findByPk(subscription.shopId);
  if (shop) {
    await shop.update({ isActive: false });
  }

  await AdminLog.create({
    adminId: (req as any).adminId || 0,
    action: 'subscription_suspended',
    entityType: 'subscription',
    entityId: subId,
    changes: JSON.stringify({ status: 'suspended', reason })
  } as any);

  res.json({ message: 'Subscription suspended', subscription });
}));

// Resume subscription
router.patch('/subscriptions/:subId/resume', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const subId = parseInt(req.params.subId);

  const subscription = await Subscription.findByPk(subId);
  if (!subscription) throw new ApiError('Subscription not found', 404);

  await subscription.update({ status: 'active' });

  const shop = await Shop.findByPk(subscription.shopId);
  if (shop) {
    await shop.update({ isActive: true });
  }

  await AdminLog.create({
    adminId: (req as any).adminId || 0,
    action: 'subscription_suspended',
    entityType: 'subscription',
    entityId: subId,
    changes: JSON.stringify({ status: 'active' })
  } as any);

  res.json({ message: 'Subscription resumed', subscription });
}));

// ======================
// KYC MANAGEMENT
// ======================

// Get pending KYC verifications
router.get('/kyc/pending', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await KYCVerification.findAndCountAll({
    where: { status: 'pending' },
    include: [{ association: 'shop' }, { association: 'user' }],
    offset,
    limit: limitNum,
    order: [['createdAt', 'ASC']]
  });

  res.json({
    data: rows,
    pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
  });
}));

// Approve KYC
router.patch('/kyc/:kycId/approve', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const kycId = parseInt(req.params.kycId);
  const kyc = await KYCVerification.findByPk(kycId);

  if (!kyc) throw new ApiError('KYC not found', 404);

  await kyc.update({
    status: 'approved',
    verifiedBy: (req as any).adminId,
    verifiedAt: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });

  const shop = await Shop.findByPk(kyc.shopId);
  if (shop) {
    await shop.update({ kycStatus: 'approved' });
  }

  await AdminLog.create({
    adminId: (req as any).adminId || 0,
    action: 'kyc_verified',
    entityType: 'kyc',
    entityId: kycId,
    changes: JSON.stringify({ status: 'approved' })
  } as any);

  res.json({ message: 'KYC approved', kyc });
}));

// Reject KYC
router.patch('/kyc/:kycId/reject', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const kycId = parseInt(req.params.kycId);
  const { rejectionReason } = req.body;

  if (!rejectionReason) throw new ApiError('Rejection reason required', 400);

  const kyc = await KYCVerification.findByPk(kycId);
  if (!kyc) throw new ApiError('KYC not found', 404);

  await kyc.update({
    status: 'rejected',
    rejectionReason,
    verifiedBy: (req as any).adminId,
    verifiedAt: new Date()
  });

  const shop = await Shop.findByPk(kyc.shopId);
  if (shop) {
    await shop.update({ kycStatus: 'rejected' });
  }

  await AdminLog.create({
    adminId: (req as any).adminId || 0,
    action: 'kyc_rejected',
    entityType: 'kyc',
    entityId: kycId,
    changes: JSON.stringify({ status: 'rejected', rejectionReason })
  } as any);

  res.json({ message: 'KYC rejected', kyc });
}));

// ======================
// ABUSE MANAGEMENT
// ======================

// Get abuse reports
router.get('/abuse-reports', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, severity, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  const filter: any = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;

  const { count, rows } = await AbuseReport.findAndCountAll({
    where: filter,
    include: [{ association: 'shop' }, { association: 'reporter' }],
    offset,
    limit: limitNum,
    order: [['severity', 'DESC'], ['createdAt', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
  });
}));

// Resolve abuse report
router.patch('/abuse-reports/:reportId/resolve', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const reportId = parseInt(req.params.reportId);
  const { actionTaken, investigationNotes } = req.body;

  if (!['warning', 'suspension', 'permanent_ban', 'none'].includes(actionTaken)) {
    throw new ApiError('Invalid action', 400);
  }

  const report = await AbuseReport.findByPk(reportId);
  if (!report) throw new ApiError('Report not found', 404);

  await report.update({
    status: 'resolved',
    actionTaken,
    investigationNotes,
    investigatedBy: (req as any).adminId,
    resolvedAt: new Date()
  });

  // Apply action to shop if needed
  if (actionTaken === 'suspension') {
    const shop = await Shop.findByPk(report.shopId);
    if (shop) {
      await shop.update({ isBlocked: true, blockReason: `Abuse report: ${report.description}` });
    }
  } else if (actionTaken === 'permanent_ban') {
    const shop = await Shop.findByPk(report.shopId);
    if (shop) {
      await shop.update({ isActive: false, isBlocked: true, blockReason: 'Permanently banned' });
    }
  }

  await AdminLog.create({
    adminId: (req as any).adminId || 0,
    action: 'abuse_resolved',
    entityType: 'abuse_report',
    entityId: reportId,
    changes: JSON.stringify({ status: 'resolved', actionTaken, investigationNotes })
  } as any);

  res.json({ message: 'Abuse report resolved', report });
}));

// ======================
// ANALYTICS
// ======================

// Platform analytics dashboard
router.get('/analytics/dashboard', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalShops, activeShops, blockedShops, pendingKYC, activeSubscriptions, revenue] = await Promise.all([
    Shop.count(),
    Shop.count({ where: { isActive: true } }),
    Shop.count({ where: { isBlocked: true } }),
    KYCVerification.count({ where: { status: 'pending' } }),
    Subscription.count({ where: { status: 'active' } }),
    PaymentRecord.sum('amount', { where: { status: 'completed', createdAt: { [Op.gte]: thirtyDaysAgo } } })
  ]);

  const abuseReports = await AbuseReport.count({ where: { status: 'open' } });

  res.json({
    shops: { total: totalShops, active: activeShops, blocked: blockedShops },
    kyc: { pending: pendingKYC },
    subscriptions: { active: activeSubscriptions },
    abuse: { openReports: abuseReports },
    revenue: { last30Days: revenue || 0 }
  });
}));

// Admin action logs
router.get('/logs', verifyToken, verifySuperAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '50' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 50;
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await AdminLog.findAndCountAll({
    include: [{ association: 'admin' }],
    offset,
    limit: limitNum,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
  });
}));

export default router;
