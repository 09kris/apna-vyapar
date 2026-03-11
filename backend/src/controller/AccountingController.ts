import { Request, Response } from 'express';
import Accounting from '../models/Accounting';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import Employee from '../models/Employee';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';
import { Op } from 'sequelize';

/* =====================================
   HELPER: Verify shop access
===================================== */
const verifyShopAccess = async (userId: string, shopId: string) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  // Check if user is the shop owner
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (shopOwner && shop.ownerId === shopOwner.ownerId) {
    return { shop, isOwner: true };
  }

  // Check if user is an active employee with accounting permissions
  const employee = await Employee.findOne({
    where: {
      userId,
      shopId,
      isActive: true
    }
  });

  if (!employee) {
    throw new ApiError(403, 'Unauthorized - not a shop owner or active employee');
  }

  // Check if employee has permission to view accounting
  const permissions = employee.permissions as any;
  if (!permissions || (!permissions.canViewAccounting && employee.staffRole !== 'Owner' && employee.staffRole !== 'Admin')) {
    throw new ApiError(403, 'You do not have permission to view accounting');
  }

  return { shop, isOwner: false, employee };
};

/* =====================================
   CREATE ACCOUNTING ENTRY
===================================== */
export const createAccountingEntry = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const { isOwner, employee } = await verifyShopAccess(userId, shopId);

  // Check if employee has permission to manage accounting
  if (!isOwner && employee) {
    const permissions = employee.permissions as any;
    if (!permissions.canManageAccounting && employee.staffRole !== 'Owner' && employee.staffRole !== 'Admin') {
      throw new ApiError(403, 'You do not have permission to manage accounting');
    }
  }

  const {
    transactionType,
    category,
    amount,
    description,
    referenceType,
    referenceId,
    paymentMode,
    transactionDate
  } = req.body;

  if (!transactionType || !category || !amount) {
    throw new ApiError(400, 'Missing required fields: transactionType, category, amount');
  }

  if (!['INCOME', 'EXPENSE'].includes(transactionType)) {
    throw new ApiError(400, 'Invalid transactionType. Must be INCOME or EXPENSE');
  }

  const accounting = await Accounting.create({
    shopId,
    transactionType,
    category,
    amount: Number(amount),
    description,
    referenceType,
    referenceId,
    paymentMode,
    transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    createdBy: userId
  });

  return res.status(201).json(
    new ApiResponse(201, accounting, 'Accounting entry created successfully')
  );
});

/* =====================================
   GET ACCOUNTING ENTRIES
===================================== */
export const getAccountingEntries = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { 
    page = 1, 
    limit = 20, 
    transactionType, 
    category,
    startDate,
    endDate,
    search
  } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  await verifyShopAccess(userId, shopId);

  const where: any = { shopId };

  if (transactionType) {
    where.transactionType = String(transactionType);
  }

  if (category) {
    where.category = String(category);
  }

  if (startDate && endDate) {
    where.transactionDate = {
      [Op.between]: [new Date(String(startDate)), new Date(String(endDate))]
    };
  }

  if (search) {
    where.description = {
      [Op.like]: `%${search}%`
    };
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: entries } = await Accounting.findAndCountAll({
    where,
    order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      items: entries,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit))
    }, 'Accounting entries retrieved successfully')
  );
});

/* =====================================
   GET SINGLE ACCOUNTING ENTRY
===================================== */
export const getAccountingById = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { accountingId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const accounting = await Accounting.findByPk(accountingId);

  if (!accounting) {
    throw new ApiError(404, 'Accounting entry not found');
  }

  await verifyShopAccess(userId, accounting.shopId);

  return res.status(200).json(
    new ApiResponse(200, accounting, 'Accounting entry retrieved successfully')
  );
});

/* =====================================
   UPDATE ACCOUNTING ENTRY
===================================== */
export const updateAccountingEntry = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { accountingId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const accounting = await Accounting.findByPk(accountingId);

  if (!accounting) {
    throw new ApiError(404, 'Accounting entry not found');
  }

  const { isOwner, employee } = await verifyShopAccess(userId, accounting.shopId);

  // Check permissions
  if (!isOwner && employee) {
    const permissions = employee.permissions as any;
    if (!permissions.canManageAccounting && employee.staffRole !== 'Owner' && employee.staffRole !== 'Admin') {
      throw new ApiError(403, 'You do not have permission to manage accounting');
    }
  }

  const {
    transactionType,
    category,
    amount,
    description,
    referenceType,
    referenceId,
    paymentMode,
    transactionDate
  } = req.body;

  await accounting.update({
    ...(transactionType && { transactionType }),
    ...(category && { category }),
    ...(amount && { amount: Number(amount) }),
    ...(description !== undefined && { description }),
    ...(referenceType && { referenceType }),
    ...(referenceId && { referenceId }),
    ...(paymentMode && { paymentMode }),
    ...(transactionDate && { transactionDate: new Date(transactionDate) })
  });

  return res.status(200).json(
    new ApiResponse(200, accounting, 'Accounting entry updated successfully')
  );
});

/* =====================================
   DELETE ACCOUNTING ENTRY
===================================== */
export const deleteAccountingEntry = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { accountingId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const accounting = await Accounting.findByPk(accountingId);

  if (!accounting) {
    throw new ApiError(404, 'Accounting entry not found');
  }

  const { isOwner, employee } = await verifyShopAccess(userId, accounting.shopId);

  // Check permissions
  if (!isOwner && employee) {
    const permissions = employee.permissions as any;
    if (!permissions.canManageAccounting && employee.staffRole !== 'Owner' && employee.staffRole !== 'Admin') {
      throw new ApiError(403, 'You do not have permission to manage accounting');
    }
  }

  await accounting.destroy();

  return res.status(200).json(
    new ApiResponse(200, null, 'Accounting entry deleted successfully')
  );
});

/* =====================================
   GET ACCOUNTING SUMMARY
===================================== */
export const getAccountingSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { startDate, endDate } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  await verifyShopAccess(userId, shopId);

  const where: any = { shopId };

  if (startDate && endDate) {
    where.transactionDate = {
      [Op.between]: [new Date(String(startDate)), new Date(String(endDate))]
    };
  }

  // Get totals
  const totalIncome = await Accounting.sum('amount', {
    where: { ...where, transactionType: 'INCOME' }
  }) || 0;

  const totalExpense = await Accounting.sum('amount', {
    where: { ...where, transactionType: 'EXPENSE' }
  }) || 0;

  const netBalance = totalIncome - totalExpense;

  // Get breakdown by category
  const incomeByCategory = await Accounting.findAll({
    where: { ...where, transactionType: 'INCOME' },
    attributes: [
      'category',
      [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
    ],
    group: ['category'],
    raw: true
  });

  const expenseByCategory = await Accounting.findAll({
    where: { ...where, transactionType: 'EXPENSE' },
    attributes: [
      'category',
      [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
    ],
    group: ['category'],
    raw: true
  });

  // Get transaction counts
  const incomeCount = await Accounting.count({
    where: { ...where, transactionType: 'INCOME' }
  });

  const expenseCount = await Accounting.count({
    where: { ...where, transactionType: 'EXPENSE' }
  });

  return res.status(200).json(
    new ApiResponse(200, {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2)),
      incomeByCategory: incomeByCategory as any[],
      expenseByCategory: expenseByCategory as any[],
      incomeCount,
      expenseCount,
      totalTransactions: incomeCount + expenseCount
    }, 'Accounting summary retrieved successfully')
  );
});

/* =====================================
   GET ACCOUNTING DASHBOARD
===================================== */
export const getAccountingDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { period = '30' } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  await verifyShopAccess(userId, shopId);

  const days = Number(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  // Current period stats
  const currentPeriodIncome = await Accounting.sum('amount', {
    where: {
      shopId,
      transactionType: 'INCOME',
      transactionDate: { [Op.between]: [startDate, endDate] }
    }
  }) || 0;

  const currentPeriodExpense = await Accounting.sum('amount', {
    where: {
      shopId,
      transactionType: 'EXPENSE',
      transactionDate: { [Op.between]: [startDate, endDate] }
    }
  }) || 0;

  // Previous period for comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  const prevPeriodIncome = await Accounting.sum('amount', {
    where: {
      shopId,
      transactionType: 'INCOME',
      transactionDate: { [Op.between]: [prevStartDate, startDate] }
    }
  }) || 0;

  const prevPeriodExpense = await Accounting.sum('amount', {
    where: {
      shopId,
      transactionType: 'EXPENSE',
      transactionDate: { [Op.between]: [prevStartDate, startDate] }
    }
  }) || 0;

  // Calculate growth percentages
  const incomeGrowth = prevPeriodIncome > 0 
    ? ((currentPeriodIncome - prevPeriodIncome) / prevPeriodIncome) * 100 
    : 0;

  const expenseGrowth = prevPeriodExpense > 0 
    ? ((currentPeriodExpense - prevPeriodExpense) / prevPeriodExpense) * 100 
    : 0;

  // Get recent transactions
  const recentTransactions = await Accounting.findAll({
    where: { shopId },
    order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
    limit: 5,
    raw: true
  });

  // Get top expense categories
  const topExpenseCategories = await Accounting.findAll({
    where: {
      shopId,
      transactionType: 'EXPENSE',
      transactionDate: { [Op.between]: [startDate, endDate] }
    },
    attributes: [
      'category',
      [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
    ],
    group: ['category'],
    order: [[require('sequelize').fn('SUM', require('sequelize').col('amount')), 'DESC']],
    limit: 5,
    raw: true
  });

  // All-time totals for the shop
  const allTimeIncome = await Accounting.sum('amount', {
    where: { shopId, transactionType: 'INCOME' }
  }) || 0;

  const allTimeExpense = await Accounting.sum('amount', {
    where: { shopId, transactionType: 'EXPENSE' }
  }) || 0;

  return res.status(200).json(
    new ApiResponse(200, {
      currentPeriod: {
        income: Number(currentPeriodIncome.toFixed(2)),
        expense: Number(currentPeriodExpense.toFixed(2)),
        net: Number((currentPeriodIncome - currentPeriodExpense).toFixed(2)),
        incomeGrowth: Number(incomeGrowth.toFixed(2)),
        expenseGrowth: Number(expenseGrowth.toFixed(2))
      },
      allTime: {
        totalIncome: Number(allTimeIncome.toFixed(2)),
        totalExpense: Number(allTimeExpense.toFixed(2)),
        netBalance: Number((allTimeIncome - allTimeExpense).toFixed(2))
      },
      recentTransactions,
      topExpenseCategories: topExpenseCategories as any[],
      period: days
    }, 'Accounting dashboard data retrieved successfully')
  );
});

/* =====================================
   BULK CREATE ACCOUNTING ENTRIES
===================================== */
export const bulkCreateAccounting = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const { isOwner, employee } = await verifyShopAccess(userId, shopId);

  // Check permissions
  if (!isOwner && employee) {
    const permissions = employee.permissions as any;
    if (!permissions.canManageAccounting && employee.staffRole !== 'Owner' && employee.staffRole !== 'Admin') {
      throw new ApiError(403, 'You do not have permission to manage accounting');
    }
  }

  const { entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new ApiError(400, 'Entries array is required');
  }

  const createdEntries = await Promise.all(
    entries.map((entry: any) =>
      Accounting.create({
        shopId,
        transactionType: entry.transactionType,
        category: entry.category,
        amount: Number(entry.amount),
        description: entry.description,
        referenceType: entry.referenceType,
        referenceId: entry.referenceId,
        paymentMode: entry.paymentMode,
        transactionDate: entry.transactionDate ? new Date(entry.transactionDate) : new Date(),
        createdBy: userId
      })
    )
  );

  return res.status(201).json(
    new ApiResponse(201, { count: createdEntries.length, entries: createdEntries }, 'Accounting entries created successfully')
  );
});

