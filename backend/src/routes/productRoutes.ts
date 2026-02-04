import { Router } from 'express';
import {
  configureProductFields,
  getProductFieldConfiguration,
  addProduct,
  getShopProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByReferenceCode,
} from '../controller/ProductController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.post('/shops/:shopId/products/configure-fields', authMiddleware, configureProductFields);
router.get('/shops/:shopId/products/field-config', authMiddleware, getProductFieldConfiguration);
router.post('/shops/:shopId/products', authMiddleware, addProduct);
router.get('/shops/:shopId/products', authMiddleware, getShopProducts);
router.get('/products/:productId', authMiddleware, getProductById);
router.put('/products/:productId', authMiddleware, updateProduct);
router.delete('/products/:productId', authMiddleware, deleteProduct);

// Public route
router.get('/products/reference/:referenceCode', getProductsByReferenceCode);

export default router;
