import { Model, DataTypes, Sequelize } from 'sequelize';

export interface ISubscription {
  id: number;
  shopId: number;
  planId: number;
  billingCycle: string; // 'monthly' or 'yearly'
  startDate: Date;
  renewalDate: Date;
  endDate?: Date;
  status: string; // 'active', 'inactive', 'suspended', 'cancelled'
  autoRenew: boolean;
  currentUsage: string; // JSON - track usage
  isPaymentPending: boolean;
  lastPaymentDate?: Date;
  nextPaymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription extends Model<ISubscription> implements ISubscription {
  declare id: number;
  declare shopId: number;
  declare planId: number;
  declare billingCycle: string;
  declare startDate: Date;
  declare renewalDate: Date;
  declare endDate?: Date;
  declare status: string;
  declare autoRenew: boolean;
  declare currentUsage: string;
  declare isPaymentPending: boolean;
  declare lastPaymentDate?: Date;
  declare nextPaymentDate: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare shop?: any;
  declare plan?: any;
  declare payments?: any[];

  static initialize(sequelize: Sequelize) {
    Subscription.init({
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shopId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'shops', key: 'id' },
        unique: true
      },
      planId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'plans', key: 'id' }
      },
      billingCycle: { type: DataTypes.ENUM('monthly', 'yearly'), defaultValue: 'monthly' },
      startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      renewalDate: { type: DataTypes.DATE, allowNull: false },
      endDate: { type: DataTypes.DATE },
      status: { type: DataTypes.ENUM('active', 'inactive', 'suspended', 'cancelled'), defaultValue: 'active' },
      autoRenew: { type: DataTypes.BOOLEAN, defaultValue: true },
      currentUsage: { type: DataTypes.JSON, defaultValue: { shops: 0, products: 0, orders: 0, employees: 0 } },
      isPaymentPending: { type: DataTypes.BOOLEAN, defaultValue: false },
      lastPaymentDate: { type: DataTypes.DATE },
      nextPaymentDate: { type: DataTypes.DATE, allowNull: false },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE }
    }, {
      sequelize,
      tableName: 'subscriptions',
      timestamps: true
    });

    return Subscription;
  }
}

export default Subscription;
