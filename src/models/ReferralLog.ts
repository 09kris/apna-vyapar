import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface IReferralLog {
  id?: number;
  shopId: number;
  referralCode: string;
  customerId?: number;
  totalOrders: number;
  totalRevenue: number;
  firstOrderId?: number;
  deviceType?: string;
  usedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReferralLog extends Model<IReferralLog> implements IReferralLog {
  public id!: number;
  public shopId!: number;
  public referralCode!: string;
  public customerId?: number;
  public totalOrders!: number;
  public totalRevenue!: number;
  public firstOrderId?: number;
  public deviceType?: string;
  public usedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ReferralLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Shops',
        key: 'id',
      },
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Customers',
        key: 'id',
      },
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    firstOrderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ReferralLog',
    tableName: 'ReferralLogs',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['referralCode'] },
      { fields: ['usedAt'] },
    ],
  }
);

export default ReferralLog;
