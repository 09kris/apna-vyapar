import { Model, DataTypes, Sequelize } from 'sequelize';

export interface IPaymentRecord {
  id: number;
  subscriptionId: number;
  shopId: number;
  planId: number;
  amount: number;
  billingCycle: string;
  paymentMethod: string; // 'card', 'upi', 'bank_transfer', 'wallet'
  paymentGateway?: string; // 'stripe', 'razorpay', 'manual'
  transactionId?: string;
  status: string; // 'pending', 'completed', 'failed', 'refunded'
  invoiceUrl?: string;
  paidAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentRecord extends Model<IPaymentRecord> implements IPaymentRecord {
  declare id: number;
  declare subscriptionId: number;
  declare shopId: number;
  declare planId: number;
  declare amount: number;
  declare billingCycle: string;
  declare paymentMethod: string;
  declare paymentGateway?: string;
  declare transactionId?: string;
  declare status: string;
  declare invoiceUrl?: string;
  declare paidAt?: Date;
  declare failureReason?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare subscription?: any;
  declare shop?: any;
  declare plan?: any;

  static initialize(sequelize: Sequelize) {
    PaymentRecord.init({
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      subscriptionId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'subscriptions', key: 'id' }
      },
      shopId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'shops', key: 'id' }
      },
      planId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'plans', key: 'id' }
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      billingCycle: { type: DataTypes.ENUM('monthly', 'yearly'), defaultValue: 'monthly' },
      paymentMethod: { type: DataTypes.ENUM('card', 'upi', 'bank_transfer', 'wallet'), allowNull: false },
      paymentGateway: { type: DataTypes.STRING(50) },
      transactionId: { type: DataTypes.STRING(100), unique: true },
      status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
      invoiceUrl: { type: DataTypes.STRING(500) },
      paidAt: { type: DataTypes.DATE },
      failureReason: { type: DataTypes.TEXT },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE }
    }, {
      sequelize,
      tableName: 'payment_records',
      timestamps: true,
      indexes: [
        { fields: ['subscriptionId'] },
        { fields: ['shopId'] },
        { fields: ['status'] },
        { fields: ['createdAt'] }
      ]
    });

    return PaymentRecord;
  }
}

export default PaymentRecord;
