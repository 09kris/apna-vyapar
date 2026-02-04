import { Request, Response } from 'express';
import { Notification, User } from '../models';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';

// Create notification
const createNotification = AsyncHandler(async (req: Request, res: Response) => {
  const { 
    userId, 
    shopId, 
    notificationType, 
    title, 
    message, 
    priority = 'Normal',
    actionUrl,
    metadata 
  } = req.body;

  const notification = await Notification.create({
    userId,
    shopId,
    notificationType,
    title,
    message,
    priority,
    actionUrl,
    metadata
  });

  res.status(201).json(
    new ApiResponse(201, notification, 'Notification created successfully')
  );
});

// Get user notifications
const getUserNotifications = AsyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const whereClause: any = { userId };
  
  if (unreadOnly === 'true') {
    whereClause.isRead = false;
  }

  const offset = (Number(page) - 1) * Number(limit);
  
  const { rows: notifications, count: totalNotifications } = await Notification.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset
  });

  // Get unread count
  const unreadCount = await Notification.count({
    where: { userId, isRead: false }
  });

  res.status(200).json(
    new ApiResponse(200, {
      notifications,
      unreadCount,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalNotifications / Number(limit)),
        totalNotifications,
        hasNext: offset + Number(limit) < totalNotifications,
        hasPrev: Number(page) > 1
      }
    }, 'Notifications fetched successfully')
  );
});

// Mark notification as read
const markAsRead = AsyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  await notification.update({
    isRead: true,
    readAt: new Date()
  });

  res.status(200).json(
    new ApiResponse(200, notification, 'Notification marked as read')
  );
});

// Mark all notifications as read
const markAllAsRead = AsyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  await Notification.update(
    {
      isRead: true,
      readAt: new Date()
    },
    {
      where: {
        userId,
        isRead: false
      }
    }
  );

  res.status(200).json(
    new ApiResponse(200, null, 'All notifications marked as read')
  );
});

// Delete notification
const deleteNotification = AsyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  await notification.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'Notification deleted successfully')
  );
});

// Send bulk notifications
const sendBulkNotifications = AsyncHandler(async (req: Request, res: Response) => {
  const { 
    userIds, 
    shopId, 
    notificationType, 
    title, 
    message, 
    priority = 'Normal',
    actionUrl,
    metadata 
  } = req.body;

  const notifications = userIds.map((userId: string) => ({
    userId,
    shopId,
    notificationType,
    title,
    message,
    priority,
    actionUrl,
    metadata
  }));

  const createdNotifications = await Notification.bulkCreate(notifications);

  res.status(201).json(
    new ApiResponse(201, {
      count: createdNotifications.length,
      notifications: createdNotifications
    }, 'Bulk notifications sent successfully')
  );
});

// Create stock alert notification
const createStockAlert = AsyncHandler(async (req: Request, res: Response) => {
  const { productName, currentStock, reorderLevel, shopId, userIds } = req.body;

  const title = 'Low Stock Alert';
  const message = `${productName} is running low. Current stock: ${currentStock}, Reorder level: ${reorderLevel}`;

  const notifications = userIds.map((userId: string) => ({
    userId,
    shopId,
    notificationType: 'Stock',
    title,
    message,
    priority: 'High',
    metadata: {
      productName,
      currentStock,
      reorderLevel
    }
  }));

  const createdNotifications = await Notification.bulkCreate(notifications);

  res.status(201).json(
    new ApiResponse(201, {
      count: createdNotifications.length
    }, 'Stock alert notifications sent')
  );
});

// Create order notification
const createOrderNotification = AsyncHandler(async (req: Request, res: Response) => {
  const { orderId, orderNumber, status, customerId, shopId, userIds } = req.body;

  const title = `Order ${status}`;
  const message = `Order #${orderNumber} has been ${status.toLowerCase()}`;

  const notifications = userIds.map((userId: string) => ({
    userId,
    shopId,
    notificationType: 'Order',
    title,
    message,
    priority: 'Normal',
    actionUrl: `/orders/${orderId}`,
    metadata: {
      orderId,
      orderNumber,
      status,
      customerId
    }
  }));

  const createdNotifications = await Notification.bulkCreate(notifications);

  res.status(201).json(
    new ApiResponse(201, {
      count: createdNotifications.length
    }, 'Order notifications sent')
  );
});

// Get notification statistics
const getNotificationStats = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { startDate, endDate } = req.query;

  const whereClause: any = { shopId };
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [require('sequelize').Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  // Total notifications sent
  const totalSent = await Notification.count({ where: whereClause });

  // Read vs unread
  const readCount = await Notification.count({
    where: { ...whereClause, isRead: true }
  });

  const unreadCount = totalSent - readCount;

  // By type
  const typeStats = await Notification.findAll({
    where: whereClause,
    attributes: [
      'notificationType',
      [require('sequelize').fn('COUNT', require('sequelize').col('notificationType')), 'count']
    ],
    group: ['notificationType']
  });

  // By priority
  const priorityStats = await Notification.findAll({
    where: whereClause,
    attributes: [
      'priority',
      [require('sequelize').fn('COUNT', require('sequelize').col('priority')), 'count']
    ],
    group: ['priority']
  });

  res.status(200).json(
    new ApiResponse(200, {
      totalSent,
      readCount,
      unreadCount,
      readRate: totalSent > 0 ? ((readCount / totalSent) * 100).toFixed(2) : 0,
      typeStats,
      priorityStats
    }, 'Notification statistics fetched successfully')
  );
});

export {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendBulkNotifications,
  createStockAlert,
  createOrderNotification,
  getNotificationStats
};