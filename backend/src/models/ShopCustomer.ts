import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface CustomerAttributes {
  customerId: string;
  shopId: string;
  userId?: string;

  customerType: 'RETAIL' | 'WHOLESALE';
  referralCodeUsed: string;

  fullName: string;
  email?: string;
  phone: string;

  companyName?: string;
  gstNumber?: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  creditLimit?: number;
  outstandingBalance?: number;
  totalPurchases?: number;
  lastPurchaseDate?: Date;

  loyaltyPoints?: number;

  isActive?: boolean;
  isBlacklisted?: boolean;
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerCreationAttributes
  extends Optional<
    CustomerAttributes,
    | 'customerId'
    | 'userId'
    | 'creditLimit'
    | 'outstandingBalance'
    | 'totalPurchases'
    | 'lastPurchaseDate'
    | 'loyaltyPoints'
    | 'isActive'
    | 'isBlacklisted'
  > {}

class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  public customerId!: string;
  public shopId!: string;
  public userId?: string;

  public customerType!: 'RETAIL' | 'WHOLESALE';
  public referralCodeUsed!: string;

  public fullName!: string;
  public email?: string;
  public phone!: string;

  public companyName?: string;
  public gstNumber?: string;

  public address?: string;
  public city?: string;
  public state?: string;
  public pincode?: string;

  public creditLimit?: number;
  public outstandingBalance?: number;
  public totalPurchases?: number;
  public lastPurchaseDate?: Date;

  public loyaltyPoints?: number;

  public isActive?: boolean;
  public isBlacklisted?: boolean;
  public notes?: string;

  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Customer.init(
  {
    customerId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerType: {
      type: DataTypes.ENUM('RETAIL', 'WHOLESALE'),
      allowNull: false,
    },
    referralCodeUsed: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    gstNumber: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    outstandingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    totalPurchases: {
      type: DataTypes.DECIMAL(12, 2),
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isBlacklisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Customers',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['phone'] },
      { fields: ['customerType'] },
      { fields: ['isActive'] },
    ],
  },
);

export default Customer;
