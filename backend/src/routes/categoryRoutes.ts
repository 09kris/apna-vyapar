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
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes - require authentication
router.use(authMiddleware);

// GET routes - accessible by both SHOP_OWNER and EMPLOYEE
router.get('/shops/:shopId/categories', getShopCategories);
router.get('/categories/:categoryId', getCategoryById);

// Configuration routes - SHOP_OWNER only
router.post('/shops/:shopId/categories/configure-fields', roleMiddleware(['SHOP_OWNER']), configureCategoryFields);
router.get('/shops/:shopId/categories/field-config', roleMiddleware(['SHOP_OWNER']), getCategoryFieldConfiguration);

// POST/PUT/DELETE routes - SHOP_OWNER only
router.post('/shops/:shopId/categories', roleMiddleware(['SHOP_OWNER']), addCategory);
router.put('/categories/:categoryId', roleMiddleware(['SHOP_OWNER']), updateCategory);
router.delete('/categories/:categoryId', roleMiddleware(['SHOP_OWNER']), deleteCategory);

export default router;
