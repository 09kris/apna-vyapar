import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { OrderStatus, PaymentStatus } from './ShopOrder';

interface OrderStatusHistoryAttributes {
  historyId: string;
  orderId: string;
  
  // Status change types
  type: 'ORDER_STATUS' | 'PAYMENT_STATUS';
  
  // Old and new values
  oldStatus: OrderStatus | PaymentStatus | null;
  newStatus: OrderStatus | PaymentStatus;
  
  // Who made the change
  changedBy: string;
  
  // Optional reason/notes
  reason?: string;
  notes?: string;
  
  // Metadata
  metadata?: any;
  
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderStatusHistoryCreationAttributes
  extends Optional<OrderStatusHistoryAttributes, 'historyId' | 'reason' | 'notes' | 'metadata'> {}

class OrderStatusHistory
  extends Model<OrderStatusHistoryAttributes, OrderStatusHistoryCreationAttributes>
  implements OrderStatusHistoryAttributes
{
  public historyId!: string;
  public orderId!: string;
  public type!: 'ORDER_STATUS' | 'PAYMENT_STATUS';
  public oldStatus!: OrderStatus | PaymentStatus | null;
  public newStatus!: OrderStatus | PaymentStatus;
  public changedBy!: string;
  public reason?: string;
  public notes?: string;
  public metadata?: any;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

OrderStatusHistory.init(
  {
    historyId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'orderId',
      },
    },
    type: {
      type: DataTypes.ENUM('ORDER_STATUS', 'PAYMENT_STATUS'),
      allowNull: false,
    },
    oldStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    changedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON, // Changed from JSONB to JSON for MariaDB compatibility
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'OrderStatusHistory',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['type'] },
      { fields: ['changedBy'] },
      { fields: ['createdAt'] },
    ],
  },
);

// =====================================================
// HELPER METHODS - Defined as static on the class
// =====================================================

// Note: Static methods will be added after class definition
// using the pattern below in the controller/service

export default OrderStatusHistory;

// =====================================================
// EXPORT STATIC HELPER FUNCTIONS
// =====================================================

/**
 * Log a status change to history
 */
export const logStatusChange = async (
  orderId: string,
  type: 'ORDER_STATUS' | 'PAYMENT_STATUS',
  oldStatus: OrderStatus | PaymentStatus | null,
  newStatus: OrderStatus | PaymentStatus,
  changedBy: string,
  reason?: string,
  notes?: string,
  metadata?: any
): Promise<OrderStatusHistory> => {
  return OrderStatusHistory.create({
    orderId,
    type,
    oldStatus,
    newStatus,
    changedBy,
    reason,
    notes,
    metadata,
  });
};

/**
 * Get status history for an order
 */
export const getOrderStatusHistory = async (
  orderId: string,
  type?: 'ORDER_STATUS' | 'PAYMENT_STATUS'
): Promise<OrderStatusHistory[]> => {
  const where: any = { orderId };
  if (type) {
    where.type = type;
  }
  
  return OrderStatusHistory.findAll({
    where,
    order: [['createdAt', 'ASC']],
  });
};

