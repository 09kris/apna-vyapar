import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface IShop {
  id?: number;
  shopName: string;
  ownerId: number;
  referralCode: string;
  shopType: 'retail' | 'wholesale' | 'both';
  category: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  description?: string;
  openingTime?: string;
  closingTime?: string;
  isActive: boolean;
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: Date;
  totalOrders: number;
  totalRevenue: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Shop extends Model<IShop> implements IShop {
  public id!: number;
  public shopName!: string;
  public ownerId!: number;
  public referralCode!: string;
  public shopType!: 'retail' | 'wholesale' | 'both';
  public category!: string;
  public address!: string;
  public city!: string;
  public state!: string;
  public pincode!: string;
  public phone?: string;
  public alternatePhone?: string;
  public email?: string;
  public gstNumber?: string;
  public panNumber?: string;
  public description?: string;
  public openingTime?: string;
  public closingTime?: string;
  public isActive!: boolean;
  public isVerified!: boolean;
  public kycStatus!: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  public isBlocked!: boolean;
  public blockReason?: string;
  public blockedAt?: Date;
  public totalOrders!: number;
  public totalRevenue!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;
}

Shop.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shopName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    shopType: {
      type: DataTypes.ENUM('retail', 'wholesale', 'both'),
      defaultValue: 'retail',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    alternatePhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gstNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    panNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    openingTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    closingTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    kycStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'needs_revision'),
      defaultValue: 'pending',
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    blockReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    blockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Shop',
    tableName: 'Shops',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['referralCode'] },
      { fields: ['ownerId'] },
      { fields: ['city'] },
    ],
  }
);

export default Shop;
