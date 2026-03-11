import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type TransactionType = 'INCOME' | 'EXPENSE';
export type AccountingCategory = 
  | 'SALES' 
  | 'SERVICE' 
  | 'OTHER_INCOME'
  | 'SALARY'
  | 'RENT'
  | 'UTILITIES'
  | 'SUPPLIES'
  | 'MAINTENANCE'
  | 'MARKETING'
  | 'TRANSPORT'
  | 'TAX'
  | 'INSURANCE'
  | 'INTEREST'
  | 'OTHER_EXPENSE';
export type PaymentMode = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'OTHER';

interface AccountingAttributes {
  accountingId: string;
  shopId: string;
  transactionType: TransactionType;
  category: AccountingCategory;
  amount: number;
  description?: string;
  referenceType?: 'ORDER' | 'PAYROLL' | 'INVENTORY' | 'MANUAL' | 'OTHER';
  referenceId?: string;
  paymentMode?: PaymentMode;
  transactionDate: Date;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AccountingCreationAttributes extends Optional<AccountingAttributes, 'accountingId'> {}

class Accounting extends Model<AccountingAttributes, AccountingCreationAttributes> implements AccountingAttributes {
  public accountingId!: string;
  public shopId!: string;
  public transactionType!: TransactionType;
  public category!: AccountingCategory;
  public amount!: number;
  public description?: string;
  public referenceType?: 'ORDER' | 'PAYROLL' | 'INVENTORY' | 'MANUAL' | 'OTHER';
  public referenceId?: string;
  public paymentMode?: PaymentMode;
  public transactionDate!: Date;
  public createdBy!: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Accounting.init(
  {
    accountingId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM('INCOME', 'EXPENSE'),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        'SALES',
        'SERVICE',
        'OTHER_INCOME',
        'SALARY',
        'RENT',
        'UTILITIES',
        'SUPPLIES',
        'MAINTENANCE',
        'MARKETING',
        'TRANSPORT',
        'TAX',
        'INSURANCE',
        'INTEREST',
        'OTHER_EXPENSE'
      ),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referenceType: {
      type: DataTypes.ENUM('ORDER', 'PAYROLL', 'INVENTORY', 'MANUAL', 'OTHER'),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    paymentMode: {
      type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'OTHER'),
      allowNull: true,
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Accountings',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['transactionType'] },
      { fields: ['category'] },
      { fields: ['transactionDate'] },
      { fields: ['shopId', 'transactionType'] },
      { fields: ['shopId', 'transactionDate'] },
      { fields: ['referenceType', 'referenceId'] },
    ],
  },
);

export default Accounting;

