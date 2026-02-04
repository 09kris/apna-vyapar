import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
  changePassword,
} from '../controller/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.post('/logout', authMiddleware, logoutUser);
router.get('/current-user', authMiddleware, getCurrentUser);
router.post('/change-password', authMiddleware, changePassword);

export default router;
