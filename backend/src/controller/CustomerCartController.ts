import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Decimal from 'decimal.js';
import { Cart, Product, Shop, ShopCustomer } from '../models';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/AsyncHandler';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Add item to cart
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { productId, quantity = 1, shopId } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!productId || !shopId) throw new ApiError(400, 'Product ID and Shop ID are required');

  // Get product details
  const product = await Product.findOne({
    where: { productId, shopId, isActive: true }
  });

  if (!product) throw new ApiError(404, 'Product not found or not available');

  // Check stock availability
  if ((product.stockQuantity || 0) < quantity) {
    throw new ApiError(400, 'Insufficient stock available');
  }

  // Determine the price based on product
  const unitPrice = product.retailPrice || product.wholesalePrice || 0;

  // Check if item already exists in cart
  const existingCartItem = await Cart.findOne({
    where: { userId, productId, shopId }
  });

  if (existingCartItem) {
    // Update quantity
    const newQuantity = existingCartItem.quantity + quantity;
    if ((product.stockQuantity || 0) < newQuantity) {
      throw new ApiError(400, 'Insufficient stock for requested quantity');
    }
    
    await existingCartItem.update({ quantity: newQuantity });
    
    return res.status(200).json(
      new ApiResponse(200, existingCartItem, 'Cart updated successfully')
    );
  }

  // Create new cart item
  const cartItem = await Cart.create({
    userId,
    shopId,
    productId,
    quantity,
    unitPrice
  });

  res.status(201).json(
    new ApiResponse(201, cartItem, 'Item added to cart successfully')
  );
});

// Get cart items
export const getCartItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { shopId } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const whereClause: any = { userId };
  if (shopId) {
    whereClause.shopId = shopId;
  }

  const cartItems = await Cart.findAll({
    where: whereClause,
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['productId', 'productName', 'productCode', 'imageUrl', 'stockQuantity', 'retailPrice', 'wholesalePrice']
      },
      {
        model: Shop,
        as: 'shop',
        attributes: ['shopId', 'shopName', 'city']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Calculate totals
  let subtotal = new Decimal(0);
  let totalItems = 0;

  const itemsWithTotals = cartItems.map(item => {
    const itemTotal = new Decimal(item.quantity).mul(item.unitPrice);
    subtotal = subtotal.plus(itemTotal);
    totalItems += item.quantity;

    return {
      ...item.toJSON(),
      itemTotal: itemTotal.toFixed(2)
    };
  });

  res.status(200).json(
    new ApiResponse(200, {
      items: itemsWithTotals,
      totalItems,
      subtotal: subtotal.toFixed(2),
      shopId: shopId || null
    }, 'Cart items retrieved successfully')
  );
});

// Update cart item quantity
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { cartId } = req.params;
  const { quantity } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!quantity || quantity < 1) throw new ApiError(400, 'Valid quantity is required');

  const cartItem = await Cart.findOne({
    where: { cartId, userId },
    include: [{ model: Product, as: 'product' }]
  });

  if (!cartItem) throw new ApiError(404, 'Cart item not found');

  // Check stock
  const product = (cartItem as any).product;
  if ((product.stockQuantity || 0) < quantity) {
    throw new ApiError(400, 'Insufficient stock available');
  }

  await cartItem.update({ quantity });

  res.status(200).json(
    new ApiResponse(200, cartItem, 'Cart updated successfully')
  );
});

// Remove item from cart
export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { cartId } = req.params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const cartItem = await Cart.findOne({
    where: { cartId, userId }
  });

  if (!cartItem) throw new ApiError(404, 'Cart item not found');

  await cartItem.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'Item removed from cart')
  );
});

// Clear cart
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { shopId } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const whereClause: any = { userId };
  if (shopId) {
    whereClause.shopId = shopId;
  }

  await Cart.destroy({ where: whereClause });

  res.status(200).json(
    new ApiResponse(200, null, 'Cart cleared successfully')
  );
});

// Get cart count
export const getCartCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const count = await Cart.sum('quantity', { where: { userId } });

  res.status(200).json(
    new ApiResponse(200, { count: count || 0 }, 'Cart count retrieved')
  );
});

