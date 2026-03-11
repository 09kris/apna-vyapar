import { Router } from 'express';
import {
  addShop,
  getMyShops,
  getShopById,
  updateShop,
  deleteShop,
  toggleShopStatus,
  getShopStats,
  configureShopFields,
  getShopFieldConfiguration,
} from '../controller/ShopController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes - no auth required for getting shops (can be accessed by employees for their shop)
// router.get('/', getPublicShops); // Uncomment if you want public shop listing

// All shop routes require authentication
router.use(authMiddleware);

// GET routes - accessible by both SHOP_OWNER and EMPLOYEE
// They can only access their own assigned shops (enforced in controller)
router.get('/', getMyShops);
router.get('/:shopId', getShopById);
router.get('/:shopId/stats', getShopStats);

// PUT/PATCH routes - accessible by both SHOP_OWNER and EMPLOYEE (with permissions)
router.patch('/:shopId', updateShop);
router.patch('/:shopId/toggle-status', toggleShopStatus);

// POST/DELETE routes - SHOP_OWNER only
router.post('/', roleMiddleware(['SHOP_OWNER']), addShop);
router.delete('/:shopId', roleMiddleware(['SHOP_OWNER']), deleteShop);

// Shop field configuration routes - SHOP_OWNER only
router.post('/:shopId/configure-fields', roleMiddleware(['SHOP_OWNER']), configureShopFields);
router.get('/:shopId/field-configuration', roleMiddleware(['SHOP_OWNER']), getShopFieldConfiguration);

export default router;
