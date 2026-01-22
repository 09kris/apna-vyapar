import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface INotification {
  id?: number;
  userId: number;
  notificationType: 'order' | 'payment' | 'inventory' | 'employee' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification extends Model<INotification> implements INotification {
  public id!: number;
  public userId!: number;
  public notificationType!: 'order' | 'payment' | 'inventory' | 'employee' | 'system';
  public title!: string;
  public message!: string;
  public priority!: 'low' | 'medium' | 'high';
  public isRead!: boolean;
  public readAt?: Date;
  public actionUrl?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    notificationType: {
      type: DataTypes.ENUM('order', 'payment', 'inventory', 'employee', 'system'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
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
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isRead'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Notification;
