import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Enquiry, Conversation, ChatMessage, Shop } from '../models';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';
import { AuthRequest } from '../middleware/authMiddleware';

// ==================== ENQUIRY CONTROLLERS ====================

// Get all enquiries for a shop
export const getEnquiries = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { status, priority, page = 1, limit = 20 } = req.query;

  const where: any = { shopId };
  
  if (status && status !== 'all') {
    where.status = status;
  }
  if (priority && priority !== 'all') {
    where.priority = priority;
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: enquiries } = await Enquiry.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  res.status(200).json({
    success: true,
    data: enquiries,
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    },
  });
});

// Get single enquiry
export const getEnquiry = AsyncHandler(async (req: Request, res: Response) => {
  const { enquiryId } = req.params;

  const enquiry = await Enquiry.findByPk(enquiryId as string, {
    include: [{ model: Shop, as: 'shop', attributes: ['shopId', 'shopName'] }],
  });

  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found');
  }

  res.status(200).json({
    success: true,
    data: enquiry,
  });
});

// Update enquiry status/response
export const updateEnquiry = AsyncHandler(async (req: Request, res: Response) => {
  const { enquiryId } = req.params;
  const { status, responseMessage, priority, assignedTo } = req.body;

  const enquiry = await Enquiry.findByPk(enquiryId as string);

  if (!enquiry) {
    throw new ApiError(404, 'Enquiry not found');
  }

  const updateData: any = {};
  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;
  if (assignedTo) updateData.assignedTo = assignedTo;
  if (responseMessage) {
    updateData.responseMessage = responseMessage;
    updateData.respondedAt = new Date();
    if (status === 'Resolved' || status === 'Closed') {
      updateData.status = status;
    }
  }

  await enquiry.update(updateData);

  res.status(200).json({
    success: true,
    message: 'Enquiry updated successfully',
    data: enquiry,
  });
});

// ==================== CONVERSATION CONTROLLERS ====================

// Get all conversations for a shop
export const getConversations = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  const where: any = { shopId };
  if (status && status !== 'all') {
    where.status = status;
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: conversations } = await Conversation.findAndCountAll({
    where,
    order: [['lastMessageAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  res.status(200).json({
    success: true,
    data: conversations,
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    },
  });
});

// Get single conversation with messages
export const getConversation = AsyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const conversation = await Conversation.findByPk(conversationId as string);

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: messages } = await ChatMessage.findAndCountAll({
    where: { conversationId: conversationId as string },
    order: [['createdAt', 'ASC']],
    limit: Number(limit),
    offset,
  });

  // Mark messages as read
  await ChatMessage.update(
    { isRead: true, readAt: new Date() },
    { where: { conversationId: conversationId as string, isRead: false } }
  );

  // Reset unread count
  await Conversation.update(
    { unreadCount: 0 },
    { where: { conversationId: conversationId as string } }
  );

  res.status(200).json({
    success: true,
    data: {
      conversation,
      messages,
    },
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    },
  });
});

// Create or get existing conversation
export const createConversation = AsyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, customerPhone, customerName, initialMessage } = req.body;

  // Check if conversation exists
  let conversation = await Conversation.findOne({
    where: {
      shopId,
      customerPhone,
      status: 'Active',
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      shopId,
      customerPhone,
      customerName,
      lastMessage: initialMessage,
      lastMessageAt: new Date(),
      unreadCount: 1,
      status: 'Active',
    });

    // Create initial message
    if (initialMessage) {
      const userId = req.user?.userId || 'guest_' + customerPhone;
      await ChatMessage.create({
        conversationId: conversation.conversationId,
        senderId: userId,
        senderType: req.user ? 'ShopOwner' : 'Customer',
        messageType: 'text',
        content: initialMessage,
        isRead: false,
      });
    }
  }

  res.status(201).json({
    success: true,
    data: conversation,
  });
});

// Close conversation
export const closeConversation = AsyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findByPk(conversationId as string);

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  await conversation.update({ status: 'Closed' });

  res.status(200).json({
    success: true,
    message: 'Conversation closed successfully',
  });
});

// ==================== MESSAGE CONTROLLERS ====================

// Send a message via REST API (alternative to socket)
export const sendMessage = AsyncHandler(async (req: AuthRequest, res: Response) => {
  const { conversationId } = req.params as { conversationId: string };
  const { content, messageType = 'text', attachmentUrl } = req.body;

  const conversation = await Conversation.findByPk(conversationId as string);

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const senderId = req.user?.userId || 'unknown';
  const senderType = 'ShopOwner'; // Since this endpoint requires auth

  const message = await ChatMessage.create({
    conversationId,
    senderId,
    senderType,
    messageType,
    content,
    attachmentUrl,
    isRead: false,
  });

  // Update conversation
  await conversation.update({
    lastMessage: content,
    lastMessageAt: new Date(),
    unreadCount: conversation.unreadCount + 1,
  });

  // Emit socket event (import socketService)
  const socketService = require('../socket/socketService').default;
  socketService.notifyConversation(conversationId as string, 'newMessage', message);
  socketService.notifyShop(conversation.shopId, 'newMessageNotification', {
    conversationId: conversationId as string,
    lastMessage: content,
    senderType,
  });

  res.status(201).json({
    success: true,
    data: message,
  });
});

// Get unread count for a shop
export const getUnreadCount = AsyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId } = req.params;

  const count = await Conversation.sum('unreadCount', {
    where: { shopId, status: 'Active' },
  });

  const enquiryCount = await Enquiry.count({
    where: { shopId, status: 'New' },
  });

  res.status(200).json({
    success: true,
    data: {
      conversations: count || 0,
      enquiries: enquiryCount,
      total: (count || 0) + enquiryCount,
    },
  });
});

