import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface IInventoryTransaction {
  id?: number;
  shopId: number;
  productId: number;
  transactionType: 'purchase' | 'sale' | 'adjustment' | 'return' | 'wastage';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: number;
  performedBy: number;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InventoryTransaction extends Model<IInventoryTransaction> implements IInventoryTransaction {
  public id!: number;
  public shopId!: number;
  public productId!: number;
  public transactionType!: 'purchase' | 'sale' | 'adjustment' | 'return' | 'wastage';
  public quantityChange!: number;
  public previousStock!: number;
  public newStock!: number;
  public referenceType?: string;
  public referenceId?: number;
  public performedBy!: number;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InventoryTransaction.init(
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
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id',
      },
    },
    transactionType: {
      type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'return', 'wastage'),
      allowNull: false,
    },
    quantityChange: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    newStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    performedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'InventoryTransaction',
    tableName: 'InventoryTransactions',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['productId'] },
      { fields: ['transactionType'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default InventoryTransaction;
