import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface NotificationAttributes {
  notificationId: string;
  userId: string;
  shopId?: string;
  notificationType: 'Order' | 'Stock' | 'Payment' | 'System' | 'Marketing';
  title: string;
  message: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, 'notificationId' | 'priority' | 'isRead'> {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public notificationId!: string;
  public userId!: string;
  public shopId?: string;
  public notificationType!: 'Order' | 'Stock' | 'Payment' | 'System' | 'Marketing';
  public title!: string;
  public message!: string;
  public priority!: 'Low' | 'Normal' | 'High' | 'Urgent';
  public isRead!: boolean;
  public readAt?: Date;
  public actionUrl?: string;
  public metadata?: any;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Notification.init(
  {
    notificationId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    notificationType: {
      type: DataTypes.ENUM('Order', 'Stock', 'Payment', 'System', 'Marketing'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Normal', 'High', 'Urgent'),
      defaultValue: 'Normal',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actionUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Notifications',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['shopId'] },
      { fields: ['isRead'] },
      { fields: ['createdAt'] },
      { fields: ['notificationType'] },
    ],
  }
);

export default Notification;