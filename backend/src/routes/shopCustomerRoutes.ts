import { Router } from 'express';
import {
  addCustomer,
  getShopCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  blacklistCustomer,
} from '../controller/ShopCustomerController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.post('/shops/:shopId/customers', authMiddleware, addCustomer);
router.get('/shops/:shopId/customers', authMiddleware, getShopCustomers);
router.get('/customers/:customerId', authMiddleware, getCustomerById);
router.put('/customers/:customerId', authMiddleware, updateCustomer);
router.delete('/customers/:customerId', authMiddleware, deleteCustomer);
router.put('/customers/:customerId/blacklist', authMiddleware, blacklistCustomer);

export default router;
