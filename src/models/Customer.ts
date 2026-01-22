import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface ICustomer {
  id?: number;
  shopId: number;
  userId?: number;
  fullName: string;
  email: string;
  phone: string;
  customerType: 'retail' | 'wholesale';
  referralCodeUsed?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  loyaltyPoints: number;
  creditLimit: number;
  outstandingBalance: number;
  isBlacklisted: boolean;
  blacklistReason?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Customer extends Model<ICustomer> implements ICustomer {
  public id!: number;
  public shopId!: number;
  public userId?: number;
  public fullName!: string;
  public email!: string;
  public phone!: string;
  public customerType!: 'retail' | 'wholesale';
  public referralCodeUsed?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public pincode?: string;
  public totalPurchases!: number;
  public lastPurchaseDate?: Date;
  public loyaltyPoints!: number;
  public creditLimit!: number;
  public outstandingBalance!: number;
  public isBlacklisted!: boolean;
  public blacklistReason?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;
}

Customer.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    customerType: {
      type: DataTypes.ENUM('retail', 'wholesale'),
      defaultValue: 'retail',
    },
    referralCodeUsed: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    totalPurchases: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    lastPurchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    outstandingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    isBlacklisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    blacklistReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'Customers',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['phone'] },
      { fields: ['customerType'] },
      { fields: ['email'] },
    ],
  }
);

export default Customer;
