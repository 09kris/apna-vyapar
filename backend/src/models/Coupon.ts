import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface CouponAttributes {
  couponId: string;
  shopId: string;
  couponCode: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  applicableTo: 'Products' | 'Categories' | 'All';
  applicableItems?: string[]; // Array of product/category IDs
  isActive: boolean;
  description?: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CouponCreationAttributes
  extends Optional<CouponAttributes, 'couponId' | 'usedCount' | 'isActive'> {}

class Coupon
  extends Model<CouponAttributes, CouponCreationAttributes>
  implements CouponAttributes
{
  public couponId!: string;
  public shopId!: string;
  public couponCode!: string;
  public discountType!: 'Percentage' | 'Fixed';
  public discountValue!: number;
  public minPurchase?: number;
  public maxDiscount?: number;
  public usageLimit?: number;
  public usedCount!: number;
  public validFrom!: Date;
  public validUntil!: Date;
  public applicableTo!: 'Products' | 'Categories' | 'All';
  public applicableItems?: string[];
  public isActive!: boolean;
  public description?: string;
  public createdBy!: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Coupon.init(
  {
    couponId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    couponCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    discountType: {
      type: DataTypes.ENUM('Percentage', 'Fixed'),
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    minPurchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    applicableTo: {
      type: DataTypes.ENUM('Products', 'Categories', 'All'),
      allowNull: false,
    },
    applicableItems: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Coupons',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['couponCode'], unique: true },
      { fields: ['isActive'] },
      { fields: ['validFrom', 'validUntil'] },
    ],
  }
);

export default Coupon;