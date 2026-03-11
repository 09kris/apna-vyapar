import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessageAttributes {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderType: 'Customer' | 'ShopOwner' | 'Employee';
  messageType: 'text' | 'image' | 'file';
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatMessageCreationAttributes
  extends Optional<ChatMessageAttributes, 'messageId' | 'isRead' | 'messageType'> {}

class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes
{
  public messageId!: string;
  public conversationId!: string;
  public senderId!: string;
  public senderType!: 'Customer' | 'ShopOwner' | 'Employee';
  public messageType!: 'text' | 'image' | 'file';
  public content!: string;
  public attachmentUrl?: string;
  public isRead!: boolean;
  public readAt?: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

ChatMessage.init(
  {
    messageId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderType: {
      type: DataTypes.ENUM('Customer', 'ShopOwner', 'Employee'),
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM('text', 'image', 'file'),
      defaultValue: 'text',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'ChatMessages',
    timestamps: true,
    indexes: [
      { fields: ['conversationId'] },
      { fields: ['senderId'] },
      { fields: ['isRead'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default ChatMessage;

