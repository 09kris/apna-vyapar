import express, { Router, Request, Response } from 'express';
import { Order, Product, Customer } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router: Router = express.Router();

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 7).replace('-', '');
  const random = Math.floor(Math.random() * 100000);
  return `ORDER-${date}-${random}`;
}

// Get orders
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { shopId, customerId, orderStatus, page = '1', limit = '20' } = req.query;
  const filter: any = {};

  if (shopId) filter.shopId = shopId;
  if (customerId) filter.customerId = customerId;
  if (orderStatus) filter.orderStatus = orderStatus;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { count, rows } = await Order.findAndCountAll({
    where: filter,
    limit: parseInt(limit as string),
    offset,
    include: ['customer'],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    orders: rows,
    pagination: { total: count, page: parseInt(page as string) }
  });
}));

// Get order
router.get('/:orderId', asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  const order = await Order.findByPk(orderId, { include: ['customer', 'shop'] });
  if (!order) throw new ApiError('Order not found', 404);
  res.json(order);
}));

// Create order
router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, customerId, items, orderType = 'retail', paymentMethod, deliveryAddress } = req.body;

  if (!shopId || !items || items.length === 0) {
    throw new ApiError('Missing required fields', 400);
  }

  let subtotal = 0, totalTax = 0, totalDiscount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (!product) throw new ApiError(`Product ${item.productId} not found`, 404);

    const unitPrice = orderType === 'wholesale' ? product.wholesalePrice : product.retailPrice;
    const discountAmount = (unitPrice * item.quantity * (item.discountPercentage || 0)) / 100;
    const taxAmount = ((unitPrice * item.quantity - discountAmount) * product.taxPercentage) / 100;
    const totalPrice = unitPrice * item.quantity - discountAmount + taxAmount;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      discountPercentage: item.discountPercentage || 0,
      taxPercentage: product.taxPercentage,
      discountAmount,
      taxAmount,
      totalPrice
    });

    subtotal += unitPrice * item.quantity;
    totalDiscount += discountAmount;
    totalTax += taxAmount;
  }

  const totalAmount = subtotal - totalDiscount + totalTax;

  const order = await Order.create({
    shopId, customerId, orderNumber: generateOrderNumber(),
    orderType, paymentStatus: 'unpaid', orderStatus: 'pending',
    items: orderItems, subtotal, taxAmount: totalTax, discountAmount: totalDiscount,
    totalAmount, paidAmount: 0, balanceAmount: totalAmount,
    paymentMethod, deliveryAddress
  });

  res.status(201).json({ message: 'Order created successfully', order });
}));

// Update order status
router.patch('/:orderId/status', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderStatus } = req.body;
  const order = await Order.findByPk(req.params.orderId);
  if (!order) throw new ApiError('Order not found', 404);

  await order.update({ orderStatus });
  res.json({ message: 'Order status updated', order });
}));

// Record payment
router.post('/:orderId/payment', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paidAmount, paymentMethod } = req.body;
  const order = await Order.findByPk(req.params.orderId);
  if (!order) throw new ApiError('Order not found', 404);

  const newPaidAmount = (order.paidAmount || 0) + paidAmount;
  const newBalance = order.totalAmount - newPaidAmount;

  await order.update({
    paidAmount: newPaidAmount,
    balanceAmount: newBalance > 0 ? newBalance : 0,
    paymentStatus: newPaidAmount >= order.totalAmount ? 'paid' : 'partial',
    paymentMethod: paymentMethod || order.paymentMethod
  });

  res.json({ message: 'Payment recorded', order });
}));

export default router;
