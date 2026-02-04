import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ReferralLogAttributes {
  referralId: string;
  shopId: string;
  customerId?: string;
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'Mobile' | 'Desktop' | 'Tablet';
  firstOrderId?: string;
  totalOrders: number;
  totalRevenue: number;
  usedAt: Date;
  lastOrderAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReferralLogCreationAttributes
  extends Optional<ReferralLogAttributes, 'referralId' | 'totalOrders' | 'totalRevenue' | 'usedAt'> {}

class ReferralLog
  extends Model<ReferralLogAttributes, ReferralLogCreationAttributes>
  implements ReferralLogAttributes
{
  public referralId!: string;
  public shopId!: string;
  public customerId?: string;
  public referralCode!: string;
  public ipAddress?: string;
  public userAgent?: string;
  public deviceType?: 'Mobile' | 'Desktop' | 'Tablet';
  public firstOrderId?: string;
  public totalOrders!: number;
  public totalRevenue!: number;
  public usedAt!: Date;
  public lastOrderAt?: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

ReferralLog.init(
  {
    referralId: {
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
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.ENUM('Mobile', 'Desktop', 'Tablet'),
      allowNull: true,
    },
    firstOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    usedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    lastOrderAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'ReferralLogs',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['customerId'] },
      { fields: ['referralCode'] },
      { fields: ['usedAt'] },
    ],
  }
);

export default ReferralLog;