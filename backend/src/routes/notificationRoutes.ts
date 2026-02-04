import { Router } from 'express';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendBulkNotifications,
  createStockAlert,
  createOrderNotification,
  getNotificationStats
} from '../controller/NotificationController';
import {authMiddleware} from '../middleware/authMiddleware';

const router = Router();

// Create notification
router.post('/notifications', authMiddleware, createNotification);

// Get user notifications
router.get('/users/:userId/notifications', authMiddleware, getUserNotifications);

// Mark notification as read
router.patch('/notifications/:notificationId/read', authMiddleware, markAsRead);

// Mark all notifications as read
router.patch('/users/:userId/notifications/read-all', authMiddleware, markAllAsRead);

// Delete notification
router.delete('/notifications/:notificationId', authMiddleware, deleteNotification);

// Send bulk notifications
router.post('/notifications/bulk', authMiddleware, sendBulkNotifications);

// Create stock alert notification
router.post('/notifications/stock-alert', authMiddleware, createStockAlert);

// Create order notification
router.post('/notifications/order', authMiddleware, createOrderNotification);

// Get notification statistics
router.get('/shops/:shopId/notifications/stats', authMiddleware, getNotificationStats);

export default router;