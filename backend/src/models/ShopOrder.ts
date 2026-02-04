import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type OrderType = 'RETAIL' | 'WHOLESALE';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'CREDIT';

interface OrderAttributes {
  orderId: string;
  orderNumber: string;
  shopId: string;
  customerId: string;
  employeeId?: string;

  orderType: OrderType;
  orderStatus: OrderStatus;

  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;

  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingCharges?: number;
  totalAmount: number;

  paidAmount?: number;
  balanceAmount?: number;

  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryPincode?: string;

  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingNumber?: string;

  customerNotes?: string;
  internalNotes?: string;

  cancelledBy?: string;
  cancellationReason?: string;

  invoiceNumber?: string;
  invoiceDate?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes
  extends Optional<
    OrderAttributes,
    | 'orderId'
    | 'orderStatus'
    | 'paymentStatus'
    | 'taxAmount'
    | 'discountAmount'
    | 'shippingCharges'
    | 'paidAmount'
    | 'balanceAmount'
    | 'invoiceNumber'
    | 'invoiceDate'
  > {}

class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public orderId!: string;
  public orderNumber!: string;
  public shopId!: string;
  public customerId!: string;
  public employeeId?: string;

  public orderType!: OrderType;
  public orderStatus!: OrderStatus;

  public paymentStatus!: PaymentStatus;
  public paymentMethod?: PaymentMethod;

  public subtotal!: number;
  public taxAmount?: number;
  public discountAmount?: number;
  public shippingCharges?: number;
  public totalAmount!: number;

  public paidAmount?: number;
  public balanceAmount?: number;

  public deliveryAddress?: string;
  public deliveryCity?: string;
  public deliveryPincode?: string;

  public estimatedDelivery?: Date;
  public actualDelivery?: Date;
  public trackingNumber?: string;

  public customerNotes?: string;
  public internalNotes?: string;

  public cancelledBy?: string;
  public cancellationReason?: string;

  public invoiceNumber?: string;
  public invoiceDate?: Date;

  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Order.init(
  {
    orderId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    orderType: {
      type: DataTypes.ENUM('RETAIL', 'WHOLESALE'),
      allowNull: false,
    },
    orderStatus: {
      type: DataTypes.ENUM(
        'PENDING',
        'CONFIRMED',
        'PARTIALLY_SHIPPED',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
      ),
      defaultValue: 'PENDING',
    },
    paymentStatus: {
      type: DataTypes.ENUM('UNPAID', 'PARTIAL', 'PAID'),
      defaultValue: 'UNPAID',
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'CARD', 'UPI', 'NET_BANKING', 'CREDIT'),
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    shippingCharges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    deliveryAddress: DataTypes.TEXT,
    deliveryCity: DataTypes.STRING(50),
    deliveryPincode: DataTypes.STRING(10),
    estimatedDelivery: DataTypes.DATE,
    actualDelivery: DataTypes.DATE,
    trackingNumber: DataTypes.STRING(50),
    customerNotes: DataTypes.TEXT,
    internalNotes: DataTypes.TEXT,
    cancelledBy: DataTypes.UUID,
    cancellationReason: DataTypes.TEXT,
    invoiceNumber: {
      type: DataTypes.STRING(20),
      unique: true,
    },
    invoiceDate: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'Orders',
    timestamps: true,
    indexes: [
      { fields: ['orderNumber'], unique: true },
      { fields: ['shopId'] },
      { fields: ['customerId'] },
      { fields: ['orderStatus'] },
      { fields: ['createdAt'] },
    ],
  },
);

export default Order;
