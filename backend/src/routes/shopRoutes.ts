import { Router } from 'express';
import {
  addShop,
  getMyShops,
  getShopById,
  updateShop,
  deleteShop,
  toggleShopStatus,
  getShopStats,
} from '../controller/ShopController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All shop routes require authentication and SHOP_OWNER role
router.use(authMiddleware);
router.use(roleMiddleware(['SHOP_OWNER']));

// Shop management routes
router.post('/add', addShop);
router.get('/my-shops', getMyShops);
router.get('/:shopId', getShopById);
router.put('/:shopId', updateShop);
router.delete('/:shopId', deleteShop);
router.patch('/:shopId/toggle-status', toggleShopStatus);
router.get('/:shopId/stats', getShopStats);

export default router;
