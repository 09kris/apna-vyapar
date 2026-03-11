import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Enquiry, Conversation, ChatMessage } from '../models';

interface ConnectedUser {
  userId: string;
  shopId: string;
  socketId: string;
  role: 'shopOwner' | 'employee' | 'customer';
}

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data: { token?: string; shopId: string; role: 'shopOwner' | 'employee' | 'customer'; customerPhone?: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Handle joining a conversation room
      socket.on('joinConversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`👤 User ${socket.id} joined conversation: ${conversationId}`);
      });

      // Handle leaving a conversation room
      socket.on('leaveConversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`👤 User ${socket.id} left conversation: ${conversationId}`);
      });

      // Handle new message
      socket.on('sendMessage', async (data: {
        conversationId: string;
        senderId: string;
        senderType: 'Customer' | 'ShopOwner' | 'Employee';
        messageType: 'text' | 'image' | 'file';
        content: string;
        attachmentUrl?: string;
        shopId: string;
      }) => {
        await this.handleNewMessage(socket, data);
      });

      // Handle new enquiry (for guest customers)
      socket.on('sendEnquiry', async (data: {
        shopId: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        subject: string;
        message: string;
      }) => {
        await this.handleNewEnquiry(socket, data);
      });

      // Handle typing indicator
      socket.on('typing', (data: { conversationId: string; userName: string }) => {
        socket.to(`conversation:${data.conversationId}`).emit('userTyping', data);
      });

      // Handle stop typing
      socket.on('stopTyping', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('userStoppedTyping');
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });

    console.log('✅ Socket.io server initialized');
    return this.io;
  }

  private handleAuthentication(socket: any, data: { token?: string; shopId: string; role: 'shopOwner' | 'employee' | 'customer'; customerPhone?: string }) {
    try {
      let userId: string;

      if (data.token) {
        // Authenticated user
        const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
        userId = decoded.userId;
      } else if (data.customerPhone) {
        // Guest customer - use phone as identifier
        userId = `guest_${data.customerPhone}`;
      } else {
        userId = socket.id;
      }

      const connectedUser: ConnectedUser = {
        userId,
        shopId: data.shopId,
        socketId: socket.id,
        role: data.role,
      };

      this.connectedUsers.set(socket.id, connectedUser);

      // Join shop room
      socket.join(`shop:${data.shopId}`);

      console.log(`🔐 User authenticated: ${userId} (${data.role}) in shop ${data.shopId}`);
      
      socket.emit('authenticated', { userId, role: data.role });
    } catch (error) {
      console.error('❌ Authentication error:', error);
      socket.emit('authError', { message: 'Authentication failed' });
    }
  }

  private async handleNewMessage(socket: any, data: {
    conversationId: string;
    senderId: string;
    senderType: 'Customer' | 'ShopOwner' | 'Employee';
    messageType: 'text' | 'image' | 'file';
    content: string;
    attachmentUrl?: string;
    shopId: string;
  }) {
    try {
      // Save message to database
      const message = await ChatMessage.create({
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        messageType: data.messageType,
        content: data.content,
        attachmentUrl: data.attachmentUrl,
        isRead: false,
      });

      // Update conversation
      await Conversation.update(
        {
          lastMessage: data.content,
          lastMessageAt: new Date(),
          unreadCount: data.senderType === 'Customer' ? 0 : undefined,
        },
        { where: { conversationId: data.conversationId } }
      );

      // If sender is customer, increment unread for shop; otherwise reset
      if (data.senderType === 'Customer') {
        await Conversation.increment('unreadCount', {
          by: 1,
          where: { conversationId: data.conversationId },
        });
      }

      // Broadcast to conversation room
      this.io?.to(`conversation:${data.conversationId}`).emit('newMessage', message);

      // Also notify shop
      this.io?.to(`shop:${data.shopId}`).emit('newMessageNotification', {
        conversationId: data.conversationId,
        lastMessage: data.content,
        senderType: data.senderType,
      });

      console.log(`💬 New message in conversation ${data.conversationId}`);
    } catch (error) {
      console.error('❌ Error saving message:', error);
      socket.emit('messageError', { message: 'Failed to send message' });
    }
  }

  private async handleNewEnquiry(socket: any, data: {
    shopId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    subject: string;
    message: string;
  }) {
    try {
      // Create enquiry
      const enquiry = await Enquiry.create({
        shopId: data.shopId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        subject: data.subject,
        message: data.message,
        status: 'New',
        priority: 'Normal',
      });

      // Create conversation for this enquiry
      const conversation = await Conversation.create({
        shopId: data.shopId,
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        lastMessage: data.message,
        lastMessageAt: new Date(),
        unreadCount: 1,
        status: 'Active',
      });

      // Send initial message in conversation
      await ChatMessage.create({
        conversationId: conversation.conversationId,
        senderId: `guest_${data.customerPhone}`,
        senderType: 'Customer',
        messageType: 'text',
        content: data.message,
        isRead: false,
      });

      // Notify shop about new enquiry
      this.io?.to(`shop:${data.shopId}`).emit('newEnquiry', {
        enquiry,
        conversation,
      });

      // Confirm to customer
      socket.emit('enquirySent', {
        enquiryId: enquiry.enquiryId,
        conversationId: conversation.conversationId,
        message: 'Your enquiry has been sent. We will get back to you soon.',
      });

      console.log(`📩 New enquiry for shop ${data.shopId} from ${data.customerPhone}`);
    } catch (error) {
      console.error('❌ Error creating enquiry:', error);
      socket.emit('enquiryError', { message: 'Failed to send enquiry' });
    }
  }

  private handleDisconnect(socket: any) {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      console.log(`🔌 User disconnected: ${user.userId}`);
      this.connectedUsers.delete(socket.id);
    }
  }

  // Utility methods
  getIO(): SocketIOServer | null {
    return this.io;
  }

  getConnectedUsers(): Map<string, ConnectedUser> {
    return this.connectedUsers;
  }

  // Send notification to a specific shop
  notifyShop(shopId: string, event: string, data: any) {
    this.io?.to(`shop:${shopId}`).emit(event, data);
  }

  // Send notification to a specific conversation
  notifyConversation(conversationId: string, event: string, data: any) {
    this.io?.to(`conversation:${conversationId}`).emit(event, data);
  }
}

export default new SocketService();

