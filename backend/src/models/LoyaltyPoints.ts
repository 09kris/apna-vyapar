import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface LoyaltyPointsAttributes {
  pointId: string;
  customerId: string;
  shopId: string;
  transactionType: 'Earn' | 'Redeem' | 'Expire';
  pointsChange: number;
  orderId?: string;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LoyaltyPointsCreationAttributes
  extends Optional<LoyaltyPointsAttributes, 'pointId'> {}

class LoyaltyPoints
  extends Model<LoyaltyPointsAttributes, LoyaltyPointsCreationAttributes>
  implements LoyaltyPointsAttributes
{
  public pointId!: string;
  public customerId!: string;
  public shopId!: string;
  public transactionType!: 'Earn' | 'Redeem' | 'Expire';
  public pointsChange!: number;
  public orderId?: string;
  public reason!: string;
  public balanceBefore!: number;
  public balanceAfter!: number;
  public expiresAt?: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

LoyaltyPoints.init(
  {
    pointId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM('Earn', 'Redeem', 'Expire'),
      allowNull: false,
    },
    pointsChange: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    balanceBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'LoyaltyPoints',
    timestamps: true,
    indexes: [
      { fields: ['customerId'] },
      { fields: ['shopId'] },
      { fields: ['transactionType'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default LoyaltyPoints;