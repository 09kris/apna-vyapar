import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type TransactionType =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGE';

export type ReferenceType =
  | 'ORDER'
  | 'PURCHASE'
  | 'MANUAL';

interface InventoryTransactionAttributes {
  transactionId: string;
  shopId: string;
  productId: string;

  transactionType: TransactionType;
  quantityChange: number;

  previousStock: number;
  newStock: number;

  referenceType?: ReferenceType;
  referenceId?: string;

  unitCost?: number;

  performedBy: string;
  remarks?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

interface InventoryTransactionCreationAttributes
  extends Optional<
    InventoryTransactionAttributes,
    | 'transactionId'
    | 'referenceType'
    | 'referenceId'
    | 'unitCost'
    | 'remarks'
    | 'updatedAt'
  > {}

class InventoryTransaction
  extends Model<
    InventoryTransactionAttributes,
    InventoryTransactionCreationAttributes
  >
  implements InventoryTransactionAttributes
{
  public transactionId!: string;
  public shopId!: string;
  public productId!: string;

  public transactionType!: TransactionType;
  public quantityChange!: number;

  public previousStock!: number;
  public newStock!: number;

  public referenceType?: ReferenceType;
  public referenceId?: string;

  public unitCost?: number;

  public performedBy!: string;
  public remarks?: string;

  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

InventoryTransaction.init(
  {
    transactionId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM(
        'PURCHASE',
        'SALE',
        'RETURN',
        'ADJUSTMENT',
        'DAMAGE',
      ),
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
      type: DataTypes.ENUM('ORDER', 'PURCHASE', 'MANUAL'),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    performedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'InventoryTransactions',
    timestamps: true,
    updatedAt: false, // audit table (immutable)
    indexes: [
      { fields: ['shopId'] },
      { fields: ['productId'] },
      { fields: ['transactionType'] },
      { fields: ['createdAt'] },
    ],
  },
);

export default InventoryTransaction;
