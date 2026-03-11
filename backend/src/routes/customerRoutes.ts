import { Router } from 'express';
import {
  addToCart,
  getCartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
} from '../controller/CustomerCartController';
import {
  getCustomerProfile,
  getMyOrders,
  getMyOrderById,
  getMyLoyaltyPoints,
  checkout
} from '../controller/CustomerDashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All customer routes require authentication
router.use(authMiddleware);

// Cart routes
router.post('/cart/add', addToCart);
router.get('/cart', getCartItems);
router.get('/cart/count', getCartCount);
router.patch('/cart/:cartId', updateCartItem);
router.delete('/cart/:cartId', removeFromCart);
router.delete('/cart', clearCart);

// Customer dashboard routes
router.get('/profile', getCustomerProfile);
router.get('/orders', getMyOrders);
router.get('/orders/:orderId', getMyOrderById);
router.get('/loyalty-points', getMyLoyaltyPoints);

// Checkout - place order from cart
router.post('/checkout', checkout);

export default router;

