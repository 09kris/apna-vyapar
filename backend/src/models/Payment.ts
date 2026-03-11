import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type PaymentStatus = 'CREATED' | 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'EMI' | 'CASH' | ' BANK_TRANSFER';

interface PaymentAttributes {
  paymentId: string;
  orderId: string;
  shopId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  upiId?: string;
  cardLast4?: string;
  bank?: string;
  wallet?: string;
  email?: string;
  contact?: string;
  description?: string;
  notes?: any;
  refundedAmount?: number;
  refundId?: string;
  webhookData?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes
  extends Optional<
    PaymentAttributes,
    | 'paymentId'
    | 'razorpayOrderId'
    | 'razorpayPaymentId'
    | 'razorpaySignature'
    | 'paymentMethod'
    | 'upiId'
    | 'cardLast4'
    | 'bank'
    | 'wallet'
    | 'email'
    | 'contact'
    | 'description'
    | 'notes'
    | 'refundedAmount'
    | 'refundId'
    | 'webhookData'
  > {}

class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public paymentId!: string;
  public orderId!: string;
  public shopId!: string;
  public razorpayOrderId?: string;
  public razorpayPaymentId?: string;
  public razorpaySignature?: string;
  public amount!: number;
  public currency!: string;
  public status!: PaymentStatus;
  public paymentMethod?: PaymentMethod;
  public upiId?: string;
  public cardLast4?: string;
  public bank?: string;
  public wallet?: string;
  public email?: string;
  public contact?: string;
  public description?: string;
  public notes?: any;
  public refundedAmount?: number;
  public refundId?: string;
  public webhookData?: any;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Payment.init(
  {
    paymentId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    razorpayOrderId: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
    },
    razorpayPaymentId: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
    },
    razorpaySignature: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.ENUM('CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'),
      defaultValue: 'CREATED',
    },
    paymentMethod: {
      type: DataTypes.ENUM('CARD', 'UPI', 'NETBANKING', 'WALLET', 'EMI', 'CASH', 'BANK_TRANSFER'),
      allowNull: true,
    },
    upiId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    cardLast4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    bank: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    wallet: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    refundedAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    refundId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    webhookData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Payments',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['shopId'] },
      { fields: ['razorpayOrderId'], unique: true },
      { fields: ['razorpayPaymentId'], unique: true },
      { fields: ['status'] },
    ],
  },
);

export default Payment;

