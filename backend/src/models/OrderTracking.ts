import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface OrderTrackingAttributes {
  trackingId: string;
  orderId: string;
  status: 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
  statusMessage?: string;
  location?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  updatedBy?: string;
  notes?: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderTrackingCreationAttributes
  extends Optional<OrderTrackingAttributes, 'trackingId' | 'timestamp'> {}

class OrderTracking
  extends Model<OrderTrackingAttributes, OrderTrackingCreationAttributes>
  implements OrderTrackingAttributes
{
  public trackingId!: string;
  public orderId!: string;
  public status!: 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
  public statusMessage?: string;
  public location?: string;
  public estimatedDelivery?: Date;
  public actualDelivery?: Date;
  public updatedBy?: string;
  public notes?: string;
  public timestamp!: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

OrderTracking.init(
  {
    trackingId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'),
      allowNull: false,
    },
    statusMessage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estimatedDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'OrderTracking',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['status'] },
      { fields: ['timestamp'] },
    ],
  }
);

export default OrderTracking;