import { Request, Response } from 'express';
import { Shop, Product, ShopOrder, ShopCustomer, Employee, ShopOrderItem } from '../models';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';
import { Op } from 'sequelize';

// Get dashboard overview
const getDashboardOverview = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { period = '30' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(period));

  // Total counts
  const totalProducts = await Product.count({
    where: { shopId, isActive: true }
  });

  const totalCustomers = await ShopCustomer.count({
    where: { shopId, isActive: true }
  });

  const totalEmployees = await Employee.count({
    where: { shopId, isActive: true }
  });

  // Period-specific metrics
  const periodOrders = await ShopOrder.findAll({
    where: {
      shopId,
      createdAt: { [Op.gte]: startDate }
    },
    attributes: ['totalAmount', 'orderStatus']
  });

  const totalRevenue = periodOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalOrders = periodOrders.length;
  const completedOrders = periodOrders.filter(order => order.orderStatus === 'Delivered').length;

  // Average order value
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Previous period comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - Number(period));

  const prevPeriodOrders = await ShopOrder.findAll({
    where: {
      shopId,
      createdAt: { [Op.between]: [prevStartDate, startDate] }
    },
    attributes: ['totalAmount']
  });

  const prevRevenue = prevPeriodOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  res.status(200).json(
    new ApiResponse(200, {
      totalProducts,
      totalCustomers,
      totalEmployees,
      totalOrders,
      completedOrders,
      totalRevenue,
      avgOrderValue,
      revenueGrowth: Number(revenueGrowth.toFixed(2)),
      period: Number(period)
    }, 'Dashboard overview fetched successfully')
  );
});

// Get sales analytics
const getSalesAnalytics = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const whereClause: any = { shopId };
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  // Sales trend data
  let dateFormat: string;
  switch (groupBy) {
    case 'hour':
      dateFormat = '%Y-%m-%d %H:00:00';
      break;
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-%u';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }

  const salesTrend = await ShopOrder.findAll({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('createdAt'), dateFormat), 'period'],
      [require('sequelize').fn('COUNT', require('sequelize').col('orderId')), 'orderCount'],
      [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'revenue']
    ],
    group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('createdAt'), dateFormat)],
    order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('createdAt'), dateFormat), 'ASC']]
  });

  // Order status breakdown
  const orderStatusStats = await ShopOrder.findAll({
    where: whereClause,
    attributes: [
      'orderStatus',
      [require('sequelize').fn('COUNT', require('sequelize').col('orderStatus')), 'count'],
      [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'revenue']
    ],
    group: ['orderStatus']
  });

  // Payment method breakdown
  const paymentMethodStats = await ShopOrder.findAll({
    where: whereClause,
    attributes: [
      'paymentMethod',
      [require('sequelize').fn('COUNT', require('sequelize').col('paymentMethod')), 'count'],
      [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'revenue']
    ],
    group: ['paymentMethod']
  });

  res.status(200).json(
    new ApiResponse(200, {
      salesTrend,
      orderStatusStats,
      paymentMethodStats
    }, 'Sales analytics fetched successfully')
  );
});

// Get product performance
const getProductPerformance = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { startDate, endDate, limit = 10 } = req.query;

  const whereClause: any = {};
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  // Top selling products
  const topProducts = await ShopOrderItem.findAll({
    attributes: [
      'productId',
      'productName',
      [require('sequelize').fn('SUM', require('sequelize').col('quantity')), 'totalQuantity'],
      [require('sequelize').fn('SUM', require('sequelize').col('totalPrice')), 'totalRevenue'],
      [require('sequelize').fn('COUNT', require('sequelize').col('orderItemId')), 'orderCount']
    ],
    include: [
      {
        model: ShopOrder,
        as: 'order',
        where: { shopId },
        attributes: []
      }
    ],
    where: whereClause,
    group: ['productId', 'productName'],
    order: [[require('sequelize').fn('SUM', require('sequelize').col('totalPrice')), 'DESC']],
    limit: Number(limit)
  });

  // Low stock products
  const lowStockProducts = await Product.findAll({
    where: {
      shopId,
      isActive: true,
      stockQuantity: {
        [Op.lte]: require('sequelize').col('reorderLevel')
      }
    },
    attributes: ['productId', 'productName', 'stockQuantity', 'reorderLevel'],
    order: [['stockQuantity', 'ASC']],
    limit: Number(limit)
  });

  // Slow moving products (no sales in last 60 days)
  const slowMovingDate = new Date();
  slowMovingDate.setDate(slowMovingDate.getDate() - 60);

  const slowMovingProducts = await Product.findAll({
    where: {
      shopId,
      isActive: true
    },
    include: [
      {
        model: ShopOrderItem,
        as: 'orderItems',
        include: [
          {
            model: ShopOrder,
            as: 'order',
            where: {
              createdAt: { [Op.gte]: slowMovingDate }
            },
            required: false
          }
        ],
        required: false
      }
    ],
    having: require('sequelize').where(
      require('sequelize').fn('COUNT', require('sequelize').col('orderItems.orderItemId')),
      0
    ),
    group: ['Product.productId'],
    attributes: ['productId', 'productName', 'stockQuantity', 'retailPrice'],
    limit: Number(limit)
  });

  res.status(200).json(
    new ApiResponse(200, {
      topProducts,
      lowStockProducts,
      slowMovingProducts
    }, 'Product performance fetched successfully')
  );
});

// Get customer analytics
const getCustomerAnalytics = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { startDate, endDate } = req.query;

  const whereClause: any = { shopId };
  const orderWhereClause: any = { shopId };
  
  if (startDate && endDate) {
    orderWhereClause.createdAt = {
      [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  // Customer type breakdown
  const customerTypeStats = await ShopCustomer.findAll({
    where: whereClause,
    attributes: [
      'customerType',
      [require('sequelize').fn('COUNT', require('sequelize').col('customerType')), 'count']
    ],
    group: ['customerType']
  });

  // Top customers by revenue
  const topCustomers = await ShopCustomer.findAll({
    where: whereClause,
    attributes: [
      'customerId',
      'fullName',
      'customerType',
      'totalPurchases',
      'loyaltyPoints'
    ],
    order: [['totalPurchases', 'DESC']],
    limit: 10
  });

  // New customers in period
  const newCustomersCount = await ShopCustomer.count({
    where: {
      shopId,
      createdAt: startDate && endDate ? {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      } : undefined
    }
  });

  // Customer retention (customers with multiple orders)
  const repeatCustomers = await ShopOrder.findAll({
    where: orderWhereClause,
    attributes: [
      'customerId',
      [require('sequelize').fn('COUNT', require('sequelize').col('orderId')), 'orderCount']
    ],
    group: ['customerId'],
    having: require('sequelize').where(
      require('sequelize').fn('COUNT', require('sequelize').col('orderId')),
      { [Op.gt]: 1 }
    )
  });

  const totalCustomersWithOrders = await ShopOrder.count({
    where: orderWhereClause,
    distinct: true,
    col: 'customerId'
  });

  const retentionRate = totalCustomersWithOrders > 0 
    ? (repeatCustomers.length / totalCustomersWithOrders) * 100 
    : 0;

  res.status(200).json(
    new ApiResponse(200, {
      customerTypeStats,
      topCustomers,
      newCustomersCount,
      repeatCustomersCount: repeatCustomers.length,
      totalCustomersWithOrders,
      retentionRate: Number(retentionRate.toFixed(2))
    }, 'Customer analytics fetched successfully')
  );
});

// Get inventory analytics
const getInventoryAnalytics = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;

  // Total inventory value
  const inventoryValue = await Product.findOne({
    where: { shopId, isActive: true },
    attributes: [
      [require('sequelize').fn('SUM', 
        require('sequelize').literal('stockQuantity * costPrice')
      ), 'totalValue']
    ]
  });

  // Category-wise inventory
  const categoryStats = await Product.findAll({
    where: { shopId, isActive: true },
    include: [
      {
        model: require('../models').Category,
        as: 'category',
        attributes: ['categoryName']
      }
    ],
    attributes: [
      'categoryId',
      [require('sequelize').fn('COUNT', require('sequelize').col('Product.productId')), 'productCount'],
      [require('sequelize').fn('SUM', require('sequelize').col('stockQuantity')), 'totalStock'],
      [require('sequelize').fn('SUM', 
        require('sequelize').literal('stockQuantity * costPrice')
      ), 'categoryValue']
    ],
    group: ['categoryId', 'category.categoryId', 'category.categoryName']
  });

  // Stock status breakdown
  const stockStatus = await Product.findAll({
    where: { shopId, isActive: true },
    attributes: [
      [require('sequelize').literal(`
        CASE 
          WHEN stockQuantity = 0 THEN 'Out of Stock'
          WHEN stockQuantity <= reorderLevel THEN 'Low Stock'
          ELSE 'In Stock'
        END
      `), 'status'],
      [require('sequelize').fn('COUNT', require('sequelize').col('productId')), 'count']
    ],
    group: [require('sequelize').literal(`
      CASE 
        WHEN stockQuantity = 0 THEN 'Out of Stock'
        WHEN stockQuantity <= reorderLevel THEN 'Low Stock'
        ELSE 'In Stock'
      END
    `)]
  });

  res.status(200).json(
    new ApiResponse(200, {
      totalInventoryValue: inventoryValue?.get('totalValue') || 0,
      categoryStats,
      stockStatus
    }, 'Inventory analytics fetched successfully')
  );
});

// Get financial summary
const getFinancialSummary = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { startDate, endDate } = req.query;

  const whereClause: any = { shopId };
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  // Revenue breakdown
  const revenueStats = await ShopOrder.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'totalRevenue'],
      [require('sequelize').fn('SUM', require('sequelize').col('taxAmount')), 'totalTax'],
      [require('sequelize').fn('SUM', require('sequelize').col('discountAmount')), 'totalDiscount'],
      [require('sequelize').fn('AVG', require('sequelize').col('totalAmount')), 'avgOrderValue']
    ]
  });

  // Payment status breakdown
  const paymentStats = await ShopOrder.findAll({
    where: whereClause,
    attributes: [
      'paymentStatus',
      [require('sequelize').fn('COUNT', require('sequelize').col('paymentStatus')), 'count'],
      [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'amount']
    ],
    group: ['paymentStatus']
  });

  // Outstanding payments
  const outstandingAmount = await ShopOrder.sum('balanceAmount', {
    where: {
      shopId,
      paymentStatus: ['Unpaid', 'Partial']
    }
  });

  res.status(200).json(
    new ApiResponse(200, {
      totalRevenue: revenueStats?.get('totalRevenue') || 0,
      totalTax: revenueStats?.get('totalTax') || 0,
      totalDiscount: revenueStats?.get('totalDiscount') || 0,
      avgOrderValue: revenueStats?.get('avgOrderValue') || 0,
      paymentStats,
      outstandingAmount: outstandingAmount || 0
    }, 'Financial summary fetched successfully')
  );
});

export {
  getDashboardOverview,
  getSalesAnalytics,
  getProductPerformance,
  getCustomerAnalytics,
  getInventoryAnalytics,
  getFinancialSummary
};