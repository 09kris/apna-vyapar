import express from 'express';
import {
  getEnquiries,
  getEnquiry,
  updateEnquiry,
  getConversations,
  getConversation,
  createConversation,
  closeConversation,
  sendMessage,
  getUnreadCount,
} from '../controller/MessageController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// ==================== ENQUIRY ROUTES ====================
// GET /api/shops/:shopId/enquiries - Get all enquiries for a shop
router.get('/shops/:shopId/enquiries', authMiddleware, getEnquiries);

// GET /api/enquiries/:enquiryId - Get single enquiry
router.get('/enquiries/:enquiryId', authMiddleware, getEnquiry);

// PUT /api/enquiries/:enquiryId - Update enquiry status/response
router.put('/enquiries/:enquiryId', authMiddleware, updateEnquiry);

// ==================== CONVERSATION ROUTES ====================
// GET /api/shops/:shopId/conversations - Get all conversations for a shop
router.get('/shops/:shopId/conversations', authMiddleware, getConversations);

// GET /api/conversations/:conversationId - Get single conversation with messages
router.get('/conversations/:conversationId', authMiddleware, getConversation);

// POST /api/conversations - Create or get existing conversation
router.post('/conversations', authMiddleware, createConversation);

// POST /api/conversations/:conversationId/close - Close conversation
router.post('/conversations/:conversationId/close', authMiddleware, closeConversation);

// ==================== MESSAGE ROUTES ====================
// POST /api/conversations/:conversationId/messages - Send a message
router.post('/conversations/:conversationId/messages', authMiddleware, sendMessage);

// ==================== UTILITY ROUTES ====================
// GET /api/shops/:shopId/messages/unread - Get unread count
router.get('/shops/:shopId/messages/unread', authMiddleware, getUnreadCount);

export default router;

