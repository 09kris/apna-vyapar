import { Request, Response } from 'express';
import { Op, Transaction } from 'sequelize';
import Decimal from 'decimal.js';
import sequelize from '../config/database';
import { Cart, Product, Shop, ShopCustomer, ShopOrder, ShopOrderItem, LoyaltyPoints } from '../models';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/AsyncHandler';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Get customer profile with shop associations
export const getCustomerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // Find customers linked to this user
  const customers = await ShopCustomer.findAll({
    where: { userId, isActive: true },
    include: [
      {
        model: Shop,
        as: 'shop',
        attributes: ['shopId', 'shopName', 'city', 'state', 'phone', 'email']
      }
    ]
  });

  if (!customers || customers.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, {
        customers: [],
        message: 'No customer profile found. You may need to register as a customer with a shop.'
      }, 'Customer profile retrieved')
    );
  }

  // Get loyalty points summary for each shop
  const customersWithPoints = await Promise.all(
    customers.map(async (customer) => {
      const loyaltyPoints = await LoyaltyPoints.sum('pointsChange', {
        where: { customerId: customer.customerId }
      });

      return {
        ...customer.toJSON(),
        loyaltyPoints: loyaltyPoints || 0
      };
    })
  );

  res.status(200).json(
    new ApiResponse(200, {
      customers: customersWithPoints
    }, 'Customer profile retrieved successfully')
  );
});

// Get my orders
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { page = 1, limit = 10, status } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // First get all customers for this user
  const customers = await ShopCustomer.findAll({
    where: { userId },
    attributes: ['customerId']
  });

  if (!customers || customers.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, {
        orders: [],
        total: 0,
        page: 1,
        totalPages: 0
      }, 'No orders found')
    );
  }

  const customerIds = customers.map(c => c.customerId);

  // Build where clause
  const whereClause: any = {
    customerId: { [Op.in]: customerIds }
  };

  if (status) {
    whereClause.orderStatus = status;
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { rows: orders, count: total } = await ShopOrder.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Shop,
        as: 'shop',
        attributes: ['shopId', 'shopName', 'city', 'phone']
      },
      {
        model: ShopOrderItem,
        as: 'items'
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset
  });

  res.status(200).json(
    new ApiResponse(200, {
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    }, 'Orders retrieved successfully')
  );
});

// Get order by ID
export const getMyOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { orderId } = req.params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // Get customers for this user
  const customers = await ShopCustomer.findAll({
    where: { userId },
    attributes: ['customerId']
  });

  const customerIds = customers.map(c => c.customerId);

  // Find order
  const order = await ShopOrder.findOne({
    where: {
      orderId,
      customerId: { [Op.in]: customerIds }
    },
    include: [
      {
        model: Shop,
        as: 'shop',
        attributes: ['shopId', 'shopName', 'city', 'phone', 'email']
      },
      {
        model: ShopOrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['productId', 'productName', 'imageUrl']
          }
        ]
      }
    ]
  });

  if (!order) throw new ApiError(404, 'Order not found');

  res.status(200).json(
    new ApiResponse(200, order, 'Order details retrieved successfully')
  );
});

// Get my loyalty points
export const getMyLoyaltyPoints = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { shopId } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  // Get customers for this user
  const whereClause: any = { userId };
  if (shopId) {
    whereClause.shopId = shopId;
  }

  const customers = await ShopCustomer.findAll({
    where: whereClause
  });

  if (!customers || customers.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, {
        points: 0,
        transactions: [],
        shops: []
      }, 'No loyalty points found')
    );
  }

  // Get total points and transactions for each shop
  const loyaltyData = await Promise.all(
    customers.map(async (customer) => {
      const totalPoints = await LoyaltyPoints.sum('pointsChange', {
        where: { customerId: customer.customerId }
      });

      const transactions = await LoyaltyPoints.findAll({
        where: { customerId: customer.customerId },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      const shop = await Shop.findByPk(customer.shopId, {
        attributes: ['shopId', 'shopName', 'city']
      });

      return {
        shop,
        customerId: customer.customerId,
        totalPoints: totalPoints || 0,
        recentTransactions: transactions
      };
    })
  );

  // Calculate total points across all shops
  const totalPoints = loyaltyData.reduce((sum, data) => sum + data.totalPoints, 0);

  res.status(200).json(
    new ApiResponse(200, {
      totalPoints,
      byShop: loyaltyData
    }, 'Loyalty points retrieved successfully')
  );
});

// Checkout - place order from cart
export const checkout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { shopId, customerId, paymentMethod, customerNotes, deliveryAddress, deliveryCity, deliveryPincode } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!shopId || !customerId) throw new ApiError(400, 'Shop ID and Customer ID are required');

  // Verify customer belongs to user
  const customer = await ShopCustomer.findOne({
    where: { customerId, userId, shopId }
  });

  if (!customer) throw new ApiError(400, 'Invalid customer or customer does not belong to you');

  // Get cart items for this shop
  const cartItems = await Cart.findAll({
    where: { userId, shopId },
    include: [{ model: Product, as: 'product' }]
  });

  if (!cartItems || cartItems.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // Validate stock and calculate totals
  let subtotal = new Decimal(0);
  let tax = new Decimal(0);
  let discount = new Decimal(0);

  interface OrderItemData {
    product: any;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    discountAmount: string;
    taxPercentage: number;
    taxAmount: string;
    subtotal: string;
    totalPrice: string;
  }

  const orderItems: OrderItemData[] = [];

  for (const cartItem of cartItems) {
    const product = (cartItem as any).product;
    
    if (!product || !product.isActive) {
      throw new ApiError(400, `Product ${cartItem.productId} is no longer available`);
    }

    if ((product.stockQuantity || 0) < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.productName}`);
    }

    const itemSubtotal = new Decimal(cartItem.quantity).mul(cartItem.unitPrice);
    const itemDiscount = itemSubtotal.mul(product.discountPercentage || 0).div(100);
    const itemTax = itemSubtotal.minus(itemDiscount).mul(product.taxPercentage || 0).div(100);

    subtotal = subtotal.plus(itemSubtotal);
    discount = discount.plus(itemDiscount);
    tax = tax.plus(itemTax);

    orderItems.push({
      product,
      quantity: cartItem.quantity,
      unitPrice: cartItem.unitPrice,
      discountPercentage: product.discountPercentage || 0,
      discountAmount: itemDiscount.toFixed(2),
      taxPercentage: product.taxPercentage || 0,
      taxAmount: itemTax.toFixed(2),
      subtotal: itemSubtotal.toFixed(2),
      totalPrice: itemSubtotal.minus(itemDiscount).plus(itemTax).toFixed(2)
    });
  }

  const totalAmount = subtotal.minus(discount).plus(tax);

  // Create order in transaction
  const order = await sequelize.transaction(async (t: Transaction) => {
    // Generate order number
    const lastOrder = await ShopOrder.findOne({
      where: { shopId },
      order: [['createdAt', 'DESC']],
      attributes: ['orderNumber'],
      transaction: t
    });

    const next = lastOrder?.orderNumber
      ? parseInt(lastOrder.orderNumber.split('-').pop() || '0') + 1
      : 1;

    const orderNumber = `ORD-${shopId.slice(0, 6)}-${String(next).padStart(6, '0')}`;

    // Create order
    const newOrder = await ShopOrder.create({
      orderNumber,
      shopId,
      customerId,
      employeeId: userId, // Customer placed order themselves
      orderType: customer.customerType || 'RETAIL',
      orderStatus: 'PENDING',
      paymentStatus: paymentMethod === 'Cash' ? 'UNPAID' : 'PAID',
      paymentMethod,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(tax.toFixed(2)),
      discountAmount: parseFloat(discount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paidAmount: paymentMethod === 'Cash' ? 0 : parseFloat(totalAmount.toFixed(2)),
      balanceAmount: paymentMethod === 'Cash' ? parseFloat(totalAmount.toFixed(2)) : 0,
      customerNotes,
      deliveryAddress,
      deliveryCity,
      deliveryPincode
    }, { transaction: t });

    // Create order items and update stock
    for (const item of orderItems) {
      await ShopOrderItem.create({
        orderId: newOrder.orderId,
        productId: item.product.productId,
        productName: item.product.productName,
        productCode: item.product.productCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage,
        discountAmount: parseFloat(item.discountAmount),
        taxPercentage: item.taxPercentage,
        taxAmount: parseFloat(item.taxAmount),
        subtotal: parseFloat(item.subtotal),
        totalPrice: parseFloat(item.totalPrice),
        itemStatus: 'PENDING'
      }, { transaction: t });

      // Decrement stock
      await Product.decrement('stockQuantity', {
        by: item.quantity,
        where: { productId: item.product.productId },
        transaction: t
      });
    }

    // Clear cart
    await Cart.destroy({
      where: { userId, shopId },
      transaction: t
    });

    // Update customer purchase stats
    await customer.increment('totalPurchases', { by: parseFloat(totalAmount.toFixed(2)), transaction: t });
    await customer.update({ lastPurchaseDate: new Date() }, { transaction: t });

    // Add loyalty points (1 point per 100 rupees)
    const loyaltyPoints = Math.floor(parseFloat(totalAmount.toFixed(2)) / 100);
    if (loyaltyPoints > 0) {
      await LoyaltyPoints.create({
        customerId,
        shopId,
        transactionType: 'Earn',
        pointsChange: loyaltyPoints,
        orderId: newOrder.orderId,
        reason: 'Purchase bonus',
        balanceBefore: customer.loyaltyPoints || 0,
        balanceAfter: (customer.loyaltyPoints || 0) + loyaltyPoints
      }, { transaction: t });

      await customer.increment('loyaltyPoints', { by: loyaltyPoints, transaction: t });
    }

    return newOrder;
  });

  // Fetch order with items
  const orderWithDetails = await ShopOrder.findByPk(order.orderId, {
    include: [
      { model: Shop, as: 'shop', attributes: ['shopId', 'shopName', 'city'] },
      { model: ShopOrderItem, as: 'items' }
    ]
  });

  res.status(201).json(
    new ApiResponse(201, orderWithDetails, 'Order placed successfully')
  );
});

