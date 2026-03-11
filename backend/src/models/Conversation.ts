import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ConversationAttributes {
  conversationId: string;
  shopId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  status: 'Active' | 'Closed';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationCreationAttributes
  extends Optional<ConversationAttributes, 'conversationId' | 'unreadCount' | 'status'> {}

class Conversation
  extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes
{
  public conversationId!: string;
  public shopId!: string;
  public customerId?: string;
  public customerName!: string;
  public customerPhone!: string;
  public lastMessage?: string;
  public lastMessageAt?: Date;
  public unreadCount!: number;
  public status!: 'Active' | 'Closed';
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Conversation.init(
  {
    conversationId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    lastMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Closed'),
      defaultValue: 'Active',
    },
  },
  {
    sequelize,
    tableName: 'Conversations',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['customerId'] },
      { fields: ['status'] },
      { fields: ['lastMessageAt'] },
    ],
  }
);

export default Conversation;

