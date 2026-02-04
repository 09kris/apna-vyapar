import { Router } from 'express';
import {
  configureCategoryFields,
  getCategoryFieldConfiguration,
  addCategory,
  getShopCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controller/CategoryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.post('/shops/:shopId/categories/configure-fields', authMiddleware, configureCategoryFields);
router.get('/shops/:shopId/categories/field-config', authMiddleware, getCategoryFieldConfiguration);
router.post('/shops/:shopId/categories', authMiddleware, addCategory);
router.get('/shops/:shopId/categories', authMiddleware, getShopCategories);
router.get('/categories/:categoryId', authMiddleware, getCategoryById);
router.put('/categories/:categoryId', authMiddleware, updateCategory);
router.delete('/categories/:categoryId', authMiddleware, deleteCategory);

export default router;
