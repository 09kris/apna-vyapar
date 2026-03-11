import { Request, Response } from 'express';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import Decimal from 'decimal.js';
import Shop from '../models/Shop';
import Customer from '../models/ShopCustomer';
import Order, { OrderStatus, OrderType, PaymentStatus } from '../models/ShopOrder';
import OrderItem, { OrderItemStatus } from '../models/ShopOrderItem';
import Product from '../models/Product';
import ShopOwner from '../models/ShopOwner';
import CustomFormField from '../models/CustomFormField';
import Employee, { DEFAULT_PERMISSIONS, StaffPermission } from '../models/Employee';
import OrderStatusHistory from '../models/OrderStatusHistory';
import { logStatusChange, getOrderStatusHistory as getOrderStatusHistoryFromModel } from '../models/OrderStatusHistory';
import InvoiceService from '../services/InvoiceService';

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

interface ShopAccessResult {
  shop: any;
  isOwner: boolean;
  isEmployee: boolean;
  employeePermissions?: any;
}

/**
 * Verify shop access - allows both owners and employees with proper permissions
 * @param userId - The user ID trying to access
 * @param shopId - The shop ID being accessed
 * @param requiredPermission - Optional permission required (e.g., 'canViewOrders', 'canManageOrders')
 */
const verifyShopAccess = async (userId: string, shopId: string, requiredPermission?: string): Promise<ShopAccessResult> => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  
  console.log('🔍 verifyShopAccess Debug:', { userId, shopId, requiredPermission });
  console.log('🔍 Shop:', { shopId: shop.shopId, ownerId: shop.ownerId });
  
  // First, look up the ShopOwner by userId to get the correct ownerId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  console.log('🔍 ShopOwner found:', shopOwner ? 'Yes' : 'No', shopOwner ? { ownerId: shopOwner.ownerId, userId: shopOwner.userId } : '');
  
  // Check if user is the shop owner (compare shopOwner.ownerId with shop.ownerId)
  if (shopOwner && shop.ownerId === shopOwner.ownerId) {
    console.log('✅ User is shop owner');
    return { shop, isOwner: true, isEmployee: false };
  }
  
  // Check if user is an employee with appropriate permissions
  const employee = await Employee.findOne({
    where: {
      userId: userId,
      shopId: shopId,
      isActive: true
    }
  });
  
  console.log('🔍 Employee found:', employee ? 'Yes' : 'No', employee ? { 
    employeeId: employee.employeeId, 
    userId: employee.userId, 
    shopId: employee.shopId,
    staffRole: employee.staffRole,
    permissions: employee.permissions
  } : '');
  
  if (employee) {
    // Get permissions - use custom permissions if set, otherwise use default based on staffRole
    // Use imported DEFAULT_PERMISSIONS from Employee model
    const customPermissions = employee.permissions;
    const roleDefaultPerms = DEFAULT_PERMISSIONS[employee.staffRole] || DEFAULT_PERMISSIONS['Staff'];
    
    console.log('🔍 Role default permissions:', roleDefaultPerms);
    console.log('🔍 Custom permissions:', customPermissions);
    
    // Merge custom permissions with default permissions (custom overrides default)
    const permissions = customPermissions 
      ? { ...roleDefaultPerms, ...customPermissions }
      : roleDefaultPerms;
    
    console.log('🔍 Final merged permissions:', permissions);
    
    // Check if specific permission is required
    if (requiredPermission) {
      const hasPermission = permissions[requiredPermission as keyof StaffPermission];
      console.log('🔍 Checking required permission:', requiredPermission, '=', hasPermission);
      if (!hasPermission) {
        throw new ApiError(403, 'Insufficient permissions');
      }
    } else {
      // For basic access, check if they have at least view orders permission
      const hasViewPermission = permissions.canViewOrders;
      console.log('🔍 Checking basic view orders permission:', hasViewPermission);
      if (!hasViewPermission) {
        throw new ApiError(403, 'Insufficient permissions');
      }
    }
    
    return { 
      shop, 
      isOwner: false, 
      isEmployee: true, 
      employeePermissions: permissions 
    };
  }
  
  // User is neither owner nor employee
  console.log('❌ User is neither owner nor employee');
  throw new ApiError(403, 'Unauthorized - You do not have access to this shop');
};

/**
 * Simplified verifyShopAccess for basic access (view orders)
 */
const verifyShopAccessBasic = async (userId: string, shopId: string) => {
  const result = await verifyShopAccess(userId, shopId);
  return result.shop;
};

const deriveOrderStatus = (statuses: OrderItemStatus[]): OrderStatus => {
  if (statuses.every(s => s === 'CANCELLED')) return 'CANCELLED';
  if (statuses.every(s => s === 'DELIVERED')) return 'DELIVERED';
  if (statuses.every(s => s === 'SHIPPED')) return 'SHIPPED';
  if (statuses.some(s => s === 'SHIPPED' || s === 'DELIVERED'))
    return 'SHIPPED'; // Changed from 'PARTIALLY_SHIPPED' to 'SHIPPED' as it's a valid OrderStatus
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

  await verifyShopAccessBasic(userId, shopId);

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
  await verifyShopAccessBasic(userId, shopId);

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

  await verifyShopAccessBasic(userId, order.shopId);

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
  await verifyShopAccessBasic(userId, order.shopId);

  res.json(new ApiResponse(200, order, 'Order fetched'));
});

/* =====================================================
   GET ORDERS (All orders for a shop)
===================================================== */

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;
  const userId = req.user?.userId;
  
  // Query params for filtering
  const { 
    status, 
    paymentStatus, 
    startDate, 
    endDate, 
    limit = 50, 
    offset = 0,
    search 
  } = req.query;

  if (!userId || !shopId) throw new ApiError(400, 'Invalid request');

  await verifyShopAccessBasic(userId, shopId);

  // Build where clause
  const where: any = { shopId };
  
  if (status) {
    where.orderStatus = status;
  }
  
  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
  }

  // Get orders with customer and items
  const orders = await Order.findAndCountAll({
    where,
    include: [
      { 
        model: Customer, 
        as: 'customer',
        attributes: ['customerId', 'fullName', 'phone', 'email'] 
      },
      { 
        model: OrderItem, 
        as: 'items',
        attributes: ['orderItemId', 'productName', 'quantity', 'unitPrice', 'totalPrice', 'itemStatus'] 
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset: Number(offset),
  });

  // If search is provided, filter in memory (for orderNumber or customerName)
  let filteredOrders = orders.rows;
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filteredOrders = filteredOrders.filter((order: any) => 
      order.orderNumber.toLowerCase().includes(searchLower) ||
      (order.customer && order.customer.fullName.toLowerCase().includes(searchLower))
    );
  }

  // Transform orders to match frontend expectations
  const transformedOrders = filteredOrders.map((order: any) => ({
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    shopId: order.shopId,
    customerId: order.customerId,
    customerName: order.customer?.fullName || 'Unknown',
    customerPhone: order.customer?.phone || '',
    customerEmail: order.customer?.email,
    items: order.items || [],
    subtotal: order.subtotal,
    discountAmount: order.discountAmount || 0,
    taxAmount: order.taxAmount || 0,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    orderType: order.orderType,
    orderDate: order.createdAt,
    deliveryDate: order.estimatedDelivery,
    notes: order.customerNotes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  res.json(new ApiResponse(200, {
    orders: transformedOrders,
    total: orders.count,
    limit: Number(limit),
    offset: Number(offset)
  }, 'Orders fetched'));
});

/* =====================================================
   UPDATE ORDER
===================================================== */

export const updateOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;
  const { orderStatus, paymentStatus, notes } = req.body;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');

  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  await verifyShopAccess(userId, order.shopId, 'canManageOrders');

  const updateData: any = {};
  if (orderStatus) updateData.orderStatus = orderStatus;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (notes !== undefined) updateData.internalNotes = sanitizeString(notes);

  await order.update(updateData);

  const updatedOrder = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }, { model: Customer, as: 'customer' }],
  });

  res.json(new ApiResponse(200, updatedOrder, 'Order updated'));
});

/* =====================================================
   CANCEL ORDER
===================================================== */

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;
  const { reason } = req.body;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');

  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.orderStatus === 'CANCELLED') {
    throw new ApiError(400, 'Order is already cancelled');
  }

  if (order.orderStatus === 'DELIVERED') {
    throw new ApiError(400, 'Cannot cancel delivered order');
  }

  await verifyShopAccess(userId, order.shopId, 'canManageOrders');

  await sequelize.transaction(async t => {
    const items = await OrderItem.findAll({ where: { orderId }, transaction: t });

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: true });
      if (product) await product.increment('stockQuantity', { by: item.quantity, transaction: t });
    }

    await order.update({ 
      orderStatus: 'CANCELLED',
      cancelledBy: userId,
      cancellationReason: sanitizeString(reason)
    }, { transaction: t });
    await OrderItem.update({ itemStatus: 'CANCELLED' }, { where: { orderId }, transaction: t });
  });

  res.json(new ApiResponse(200, null, 'Order cancelled'));
});

/* =====================================================
   VALID STATUS TRANSITIONS
   Define which status transitions are allowed
===================================================== */
const VALID_ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'DRAFT': ['PENDING', 'CANCELLED'],
  'PENDING': ['CONFIRMED', 'CANCELLED'],
  'CONFIRMED': ['PROCESSING', 'CANCELLED'],
  'PROCESSING': ['SHIPPED', 'CANCELLED'],
  'SHIPPED': ['DELIVERED', 'RETURNED'],
  'DELIVERED': ['COMPLETED', 'RETURNED'],
  'COMPLETED': ['RETURNED'],
  'CANCELLED': [],
  'RETURNED': [],
};

/**
 * Validate if status transition is allowed
 */
const isValidStatusTransition = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
  const allowedTransitions = VALID_ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Apply auto-status logic based on payment status changes
 */
const applyAutoStatusLogic = async (
  order: Order,
  oldPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus,
  userId: string
): Promise<{ autoStatusUpdate?: Partial<Order>, autoNotes?: string }> => {
  // When payment becomes PAID, order can move to CONFIRMED
  if (oldPaymentStatus !== 'PAID' && newPaymentStatus === 'PAID') {
    if (order.orderStatus === 'PENDING') {
      return {
        autoStatusUpdate: { orderStatus: 'CONFIRMED' },
        autoNotes: 'Auto-confirmed due to payment'
      };
    }
  }
  
  // When payment is refunded, order status might need review
  if (newPaymentStatus === 'REFUNDED') {
    if (order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED') {
      return {
        autoStatusUpdate: { orderStatus: 'RETURNED' },
        autoNotes: 'Auto-marked as returned due to refund'
      };
    }
  }
  
  // When payment fails
  if (newPaymentStatus === 'FAILED') {
    if (order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PROCESSING') {
      return {
        autoStatusUpdate: { orderStatus: 'CANCELLED' },
        autoNotes: 'Auto-cancelled due to payment failure'
      };
    }
  }
  
  return {};
};

/* =====================================================
   UPDATE ORDER STATUS (with history tracking)
===================================================== */

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;
  const { orderStatus, reason, notes } = req.body;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');
  if (!orderStatus) throw new ApiError(400, 'Order status is required');

  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  await verifyShopAccess(userId, order.shopId, 'canManageOrders');

  const oldStatus = order.orderStatus;
  
  // Validate status transition
  if (!isValidStatusTransition(oldStatus, orderStatus)) {
    throw new ApiError(400, `Cannot transition from ${oldStatus} to ${orderStatus}`);
  }

  // Update order status
  await order.update({ orderStatus });

  // Log status change to history
  await logStatusChange(
    orderId,
    'ORDER_STATUS',
    oldStatus,
    orderStatus,
    userId,
    reason,
    notes
  );

  // If order is being cancelled or returned, restore stock
  if (orderStatus === 'CANCELLED' || orderStatus === 'RETURNED') {
    await sequelize.transaction(async t => {
      const items = await OrderItem.findAll({ where: { orderId }, transaction: t });
      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction: t, lock: true });
        if (product) {
          await product.increment('stockQuantity', { by: item.quantity, transaction: t });
        }
      }
      await OrderItem.update(
        { itemStatus: orderStatus === 'CANCELLED' ? 'CANCELLED' : 'RETURNED' },
        { where: { orderId }, transaction: t }
      );
    });
  }

  // If delivered, set actual delivery date
  if (orderStatus === 'DELIVERED') {
    await order.update({ actualDelivery: new Date() });
  }

  const updatedOrder = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }, { model: Customer, as: 'customer' }],
  });

  res.json(new ApiResponse(200, updatedOrder, 'Order status updated'));
});

/* =====================================================
   UPDATE PAYMENT STATUS (with history tracking)
===================================================== */

export const updatePaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;
  const { paymentStatus, paidAmount, reason, notes } = req.body;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');
  if (!paymentStatus) throw new ApiError(400, 'Payment status is required');

  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  await verifyShopAccess(userId, order.shopId, 'canManageOrders');

  const oldPaymentStatus = order.paymentStatus;
  
  // Calculate amounts
  let paidAmountValue = order.paidAmount || 0;
  if (paidAmount !== undefined) {
    paidAmountValue = paidAmount;
  } else if (paymentStatus === 'PAID') {
    paidAmountValue = order.totalAmount;
  }

  const balanceAmount = Math.max(0, order.totalAmount - paidAmountValue);

  // Update payment status
  await order.update({
    paymentStatus,
    paidAmount: paidAmountValue,
    balanceAmount,
  });

  // Log status change to history
  await logStatusChange(
    orderId,
    'PAYMENT_STATUS',
    oldPaymentStatus,
    paymentStatus,
    userId,
    reason,
    notes,
    { paidAmount: paidAmountValue, totalAmount: order.totalAmount }
  );

  // Apply auto-status logic
  const autoLogic = await applyAutoStatusLogic(order, oldPaymentStatus, paymentStatus, userId);
  if (autoLogic.autoStatusUpdate) {
    const oldOrderStatus = order.orderStatus;
    await order.update(autoLogic.autoStatusUpdate);
    
    // Log auto status change
    await logStatusChange(
      orderId,
      'ORDER_STATUS',
      oldOrderStatus,
      autoLogic.autoStatusUpdate.orderStatus!,
      userId,
      'Auto-status change',
      autoLogic.autoNotes
    );
  }

  const updatedOrder = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }, { model: Customer, as: 'customer' }],
  });

  res.json(new ApiResponse(200, updatedOrder, 'Payment status updated'));
});

/* =====================================================
   GET ORDER STATUS HISTORY
===================================================== */

export const getOrderStatusHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;
  const { type } = req.query;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');

  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  await verifyShopAccessBasic(userId, order.shopId);

  const history = await getOrderStatusHistoryFromModel(
    orderId,
    type as 'ORDER_STATUS' | 'PAYMENT_STATUS' | undefined
  );

  res.json(new ApiResponse(200, history, 'Status history fetched'));
});

/* =====================================================
   GET AVAILABLE STATUS OPTIONS
===================================================== */

export const getStatusOptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');

  const order = await Order.findByPk(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  await verifyShopAccessBasic(userId, order.shopId);

  const currentOrderStatus = order.orderStatus;
  const allowedTransitions = VALID_ORDER_STATUS_TRANSITIONS[currentOrderStatus] || [];

  const statusOptions = {
    orderStatuses: {
      current: currentOrderStatus,
      available: allowedTransitions.map(status => ({
        value: status,
        label: status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' '),
      })),
      all: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'PROCESSING', label: 'Processing' },
        { value: 'SHIPPED', label: 'Shipped' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'RETURNED', label: 'Returned' },
      ],
    },
    paymentStatuses: {
      current: order.paymentStatus,
      all: [
        { value: 'UNPAID', label: 'Unpaid' },
        { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
        { value: 'PAID', label: 'Paid' },
        { value: 'REFUNDED', label: 'Refunded' },
        { value: 'FAILED', label: 'Failed' },
      ],
    },
  };

  res.json(new ApiResponse(200, statusOptions, 'Status options fetched'));
});

/* =====================================================
   GENERATE INVOICE
===================================================== */

export const generateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;

  if (!orderId || !userId) throw new ApiError(400, 'Invalid request');

  // Get order with items and customer
  const order = await Order.findByPk(orderId, {
    include: [
      { model: OrderItem, as: 'items' },
      { model: Customer, as: 'customer' }
    ],
  });

  if (!order) throw new ApiError(404, 'Order not found');

  await verifyShopAccessBasic(userId, order.shopId);

  // Get shop details
  const shop = await Shop.findByPk(order.shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  // Prepare invoice data
  const customer = (order as any).customer;
  const orderItems = (order as any).items || [];
  
  const invoiceData = {
    orderId: order.orderId,
    orderDate: order.createdAt || new Date(),
    invoiceNumber: order.invoiceNumber || `INV-${order.orderNumber || order.orderId}`,
    shop: {
      shopName: shop.shopName,
      gstNumber: shop.gstNumber,
      panNumber: shop.panNumber,
      address: shop.address || '',
      city: shop.city || '',
      state: shop.state || '',
      pincode: shop.zipCode || '',
      phone: shop.phoneNumber || '',
      email: shop.email,
    },
    customer: {
      name: customer?.fullName || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      city: customer?.city || '',
      state: customer?.state || '',
      pincode: customer?.pincode || '',
    },
    items: orderItems.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discountAmount || 0,
      hsnCode: item.hsnCode || 'N/A',
      sgstRate: item.sgstRate || 0,
      cgstRate: item.cgstRate || 0,
      igstRate: item.igstRate || 0,
    })),
    subtotal: order.subtotal,
    discount: order.discountAmount || 0,
    sgst: (order.taxAmount || 0) / 2,
    cgst: (order.taxAmount || 0) / 2,
    igst: 0,
    total: order.totalAmount,
  };

  // Generate PDF
  const pdfStream = InvoiceService.generateInvoicePDF(invoiceData);

  // Set response headers for file download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber || order.orderId}.pdf"`);

  // Pipe the PDF stream to response
  pdfStream.pipe(res as any);
});
