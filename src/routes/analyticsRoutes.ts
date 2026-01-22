import express, { Router, Request, Response } from 'express';
import { Order, Product, Employee, Payroll, Customer } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { Op, fn, col } from 'sequelize';

const router: Router = express.Router();

// Sales report
router.get('/sales', asyncHandler(async (req: Request, res: Response) => {
  const { shopId, startDate, endDate } = req.query;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum)) {
    throw new ApiError('Shop ID required', 400);
  }

  const filter: any = { shopId: shopIdNum };
  if (startDate) filter.createdAt = { [Op.gte]: new Date(startDate as string) };
  if (endDate) filter.createdAt = { ...filter.createdAt, [Op.lte]: new Date(endDate as string) };

  const orders = await Order.findAll({ where: filter });

  const totalSales = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
  const retailSales = orders.filter((o: any) => o.orderType === 'retail')
    .reduce((sum: number, o: any) => sum + o.totalAmount, 0);
  const wholesaleSales = orders.filter((o: any) => o.orderType === 'wholesale')
    .reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  res.json({
    totalSales,
    totalOrders: orders.length,
    avgOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
    retailSales,
    wholesaleSales
  });
}));

// Inventory report
router.get('/inventory', asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.query;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum)) throw new ApiError('Shop ID required', 400);

  const products = await Product.findAll({ where: { shopId: shopIdNum } });

  const lowStock = products.filter(p => p.stockQuantity < p.reorderLevel).length;
  const overstock = products.filter(p => p.stockQuantity > p.maxStockLevel).length;
  const totalValue = products.reduce((sum: number, p: any) => sum + (p.stockQuantity * p.costPrice), 0);

  res.json({
    totalProducts: products.length,
    totalValue,
    lowStock,
    overstock,
    deadStock: products.filter(p => p.stockQuantity === 0).length
  });
}));

// Customer analytics
router.get('/customers', asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.query;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum)) throw new ApiError('Shop ID required', 400);

  const customers = await Customer.findAll({ where: { shopId: shopIdNum } });
  const totalRevenue = customers.reduce((sum: number, c: any) => sum + (c.totalPurchases || 0), 0);

  res.json({
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.isActive).length,
    wholesaleCustomers: customers.filter(c => c.customerType === 'wholesale').length,
    totalRevenue,
    avgCustomerValue: customers.length > 0 ? totalRevenue / customers.length : 0
  });
}));

// Payroll report
router.get('/payroll', asyncHandler(async (req: Request, res: Response) => {
  const { shopId, salaryMonth } = req.query;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum)) throw new ApiError('Shop ID required', 400);

  const filter: any = { shopId: shopIdNum };
  if (salaryMonth) filter.salaryMonth = salaryMonth;

  const payrolls = await Payroll.findAll({ where: filter });

  const totalSalary = payrolls.reduce((sum: number, p: any) => sum + p.basicSalary, 0);
  const totalDeductions = payrolls.reduce((sum: number, p: any) => sum + p.totalDeductions, 0);

  res.json({
    totalEmployees: payrolls.length,
    totalSalary,
    totalDeductions,
    paidCount: payrolls.filter(p => p.paymentStatus === 'paid').length,
    pendingCount: payrolls.filter(p => p.paymentStatus === 'pending').length,
    averageSalary: payrolls.length > 0 ? totalSalary / payrolls.length : 0
  });
}));

// Dashboard summary
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.query;
  const shopIdNum = parseInt(shopId as string);

  if (!shopId || isNaN(shopIdNum)) throw new ApiError('Shop ID required', 400);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [orders, customers, products, payrolls] = await Promise.all([
    Order.findAll({ where: { shopId: shopIdNum, createdAt: { [Op.gte]: thirtyDaysAgo } } }),
    Customer.findAll({ where: { shopId: shopIdNum } }),
    Product.findAll({ where: { shopId: shopIdNum } }),
    Payroll.findAll({ where: { shopId: shopIdNum, createdAt: { [Op.gte]: thirtyDaysAgo } } })
  ]);

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
  const lowStockProducts = products.filter(p => p.stockQuantity < p.reorderLevel).length;
  const pendingPayroll = payrolls.filter(p => p.paymentStatus === 'pending').length;

  res.json({
    summary: {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      lowStockProducts,
      pendingPayroll
    },
    period: 'Last 30 days'
  });
}));

export default router;
