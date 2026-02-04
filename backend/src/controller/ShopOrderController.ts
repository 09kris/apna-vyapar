import { Request, Response } from 'express';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import Decimal from 'decimal.js';

import Order, { OrderStatus, OrderType } from '../models/ShopOrder';
import OrderItem, { OrderItemStatus } from '../models/ShopOrderItem';
import Product from '../models/Product';
import Customer from '../models/ShopCustomer';
import Shop from '../models/Shop';
import CustomFormField from '../models/CustomFormField';

import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* =====================================================
   ENUMS & TYPES
===================================================== */


export enum ItemStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
  params: {
    shopId?: string;
    orderId?: string;
    orderItemId?: string;
  };
}

interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  taxPercentage?: number;
  notes?: string;
}

interface CreateOrderInput {
  customerId: string;
  orderType: OrderType;
  items: OrderItemInput[];
  customerNotes?: string;
  internalNotes?: string;
}

/* =====================================================
   HELPERS
===================================================== */

const sanitizeString = (str?: string) =>
  str ? str.trim().slice(0, 5000) : undefined;

const validateOrderItem = (item: OrderItemInput) => {
  if (!item.productId || !item.quantity || item.unitPrice === undefined) {
    throw new ApiError(400, 'Invalid order item');
  }
  if (item.quantity <= 0) throw new ApiError(400, 'Quantity must be > 0');
  if (item.unitPrice < 0) throw new ApiError(400, 'Price cannot be negative');
};

const verifyShopAccess = async (userId: string, shopId: string) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');
  return shop;
};

const deriveOrderStatus = (statuses: OrderItemStatus[]): OrderStatus => {
  if (statuses.every(s => s === 'CANCELLED')) return 'CANCELLED';
  if (statuses.every(s => s === 'DELIVERED')) return 'DELIVERED';
  if (statuses.every(s => s === 'SHIPPED')) return 'SHIPPED';
  if (statuses.some(s => s === 'SHIPPED' || s === 'DELIVERED'))
    return 'PARTIALLY_SHIPPED';
  return 'PENDING';
};

const generateOrderNumber = async (shopId: string, t: Transaction) => {
  const last = await Order.findOne({
    where: { shopId },
    order: [['createdAt', 'DESC']],
    attributes: ['orderNumber'],
    transaction: t,
    lock: true,
  });

  const next = last?.orderNumber
    ? parseInt(last.orderNumber.split('-').pop() || '0') + 1
    : 1;

  return `ORD-${shopId.slice(0, 6)}-${String(next).padStart(6, '0')}`;
};

/* =====================================================
   CONFIGURE ORDER FIELDS
===================================================== */

export const configureOrderFields = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  const { fields } = req.body;

  if (!userId || !shopId) throw new ApiError(400, 'Invalid request');
  if (!Array.isArray(fields)) throw new ApiError(400, 'Fields must be array');

  await verifyShopAccess(userId, shopId);

  const config = await CustomFormField.findOne({
    where: { shopId, tableName: 'Order' },
  });

  if (config) {
    await config.update({ fields: JSON.stringify(fields), updatedBy: userId });
  } else {
    await CustomFormField.create({
      shopId,
      tableName: 'Order',
      fields: JSON.stringify(fields),
      status: 'ACTIVE',
      createdBy: userId,
    });
  }

  res.json(new ApiResponse(200, null, 'Order fields configured'));
});

/* =====================================================
   CREATE ORDER
===================================================== */

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  const { customerId, orderType, items, customerNotes, internalNotes }: CreateOrderInput = req.body;

  if (!userId || !shopId) throw new ApiError(401, 'Unauthorized');
  if (!customerId || !items?.length) throw new ApiError(400, 'Invalid data');

  items.forEach(validateOrderItem);
  await verifyShopAccess(userId, shopId);

  const customer = await Customer.findByPk(customerId);
  if (!customer || customer.shopId !== shopId)
    throw new ApiError(400, 'Invalid customer');

  const result = await sequelize.transaction(async t => {
    const productIds = items.map(i => i.productId);
    if (new Set(productIds).size !== productIds.length)
      throw new ApiError(400, 'Duplicate products not allowed');

    const products = await Product.findAll({
      where: { productId: { [Op.in]: productIds }, shopId },
      transaction: t,
      lock: true,
    });

    let subtotal = new Decimal(0);
    let tax = new Decimal(0);
    let discount = new Decimal(0);

    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.productId === item.productId);
      if (!product) throw new ApiError(400, 'Invalid product');

      if ((product.stockQuantity ?? 0) < item.quantity)
        throw new ApiError(400, 'Insufficient stock');

      const itemSubtotal = new Decimal(item.quantity).mul(item.unitPrice);
      const itemDiscount = itemSubtotal.mul(item.discountPercentage || 0).div(100);
      const itemTax = itemSubtotal.minus(itemDiscount).mul(item.taxPercentage || 0).div(100);

      subtotal = subtotal.plus(itemSubtotal);
      discount = discount.plus(itemDiscount);
      tax = tax.plus(itemTax);

      await product.decrement('stockQuantity', { by: item.quantity, transaction: t });

      orderItems.push({
        product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage || 0,
        discountAmount: itemDiscount.toFixed(2),
        taxPercentage: item.taxPercentage || 0,
        taxAmount: itemTax.toFixed(2),
        subtotal: itemSubtotal.toFixed(2),
        totalPrice: itemSubtotal.minus(itemDiscount).plus(itemTax).toFixed(2),
        notes: sanitizeString(item.notes),
      });
    }

    const order = await Order.create(
      {
        orderNumber: await generateOrderNumber(shopId, t),
        shopId,
        customerId,
        employeeId: userId,
        orderType,
        orderStatus: 'PENDING',
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: parseFloat(tax.toFixed(2)),
        discountAmount: parseFloat(discount.toFixed(2)),
        totalAmount: parseFloat(subtotal.minus(discount).plus(tax).toFixed(2)),
        customerNotes: sanitizeString(customerNotes),
        internalNotes: sanitizeString(internalNotes),
      },
      { transaction: t },
    );

    await OrderItem.bulkCreate(
      orderItems.map(i => ({
        orderId: order.orderId,
        productId: i.product.productId,
        productName: i.product.productName,
        productCode: i.product.productCode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountPercentage: i.discountPercentage,
        discountAmount: parseFloat(i.discountAmount),
        taxPercentage: i.taxPercentage,
        taxAmount: parseFloat(i.taxAmount),
        subtotal: parseFloat(i.subtotal),
        totalPrice: parseFloat(i.totalPrice),
        itemStatus: 'PENDING',
        notes: i.notes,
      })),
      { transaction: t },
    );

    return order;
  });

  res.status(201).json(new ApiResponse(201, result, 'Order created'));
});

/* =====================================================
   UPDATE ORDER ITEM STATUS
===================================================== */

export const updateOrderItemStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderItemId } = req.params;
  const { itemStatus } = req.body;
  const userId = req.user?.userId;

  if (!userId || !orderItemId) throw new ApiError(400, 'Invalid request');

  const orderItem = await OrderItem.findByPk(orderItemId);
  if (!orderItem) throw new ApiError(404, 'Item not found');

  const order = await Order.findByPk(orderItem.orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  await verifyShopAccess(userId, order.shopId);

  await orderItem.update({ itemStatus });

  const items = await OrderItem.findAll({ where: { orderId: order.orderId } });
  const newStatus = deriveOrderStatus(items.map(i => i.itemStatus as OrderItemStatus));

  await order.update({ orderStatus: newStatus });

  res.json(new ApiResponse(200, { orderItem, orderStatus: newStatus }, 'Item updated'));
});

/* =====================================================
   GET ORDER
===================================================== */

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');

  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }, { model: Customer, as: 'customer' }],
  });

  if (!order) throw new ApiError(404, 'Order not found');
  await verifyShopAccess(userId, order.shopId);

  res.json(new ApiResponse(200, order, 'Order fetched'));
});

/* =====================================================
   CANCEL ORDER
===================================================== */

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');

  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  await verifyShopAccess(userId, order.shopId);

  await sequelize.transaction(async t => {
    const items = await OrderItem.findAll({ where: { orderId }, transaction: t });

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) await product.increment('stockQuantity', { by: item.quantity, transaction: t });
    }

    await order.update({ orderStatus: 'CANCELLED' }, { transaction: t });
    await OrderItem.update({ itemStatus: 'CANCELLED' }, { where: { orderId }, transaction: t });
  });

  res.json(new ApiResponse(200, null, 'Order cancelled'));
});
