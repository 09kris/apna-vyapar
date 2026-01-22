import { DataTypes, Model, DataType } from 'sequelize';
import { sequelize } from '../config/database';

export interface IOrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxPercentage: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
}

export interface IOrder {
  id?: number;
  shopId: number;
  customerId?: number;
  orderNumber: string;
  orderType: 'retail' | 'wholesale';
  orderStatus: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: string;
  deliveryAddress?: string;
  customerNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Order extends Model<IOrder> implements IOrder {
  public id!: number;
  public shopId!: number;
  public customerId?: number;
  public orderNumber!: string;
  public orderType!: 'retail' | 'wholesale';
  public orderStatus!: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  public paymentStatus!: 'unpaid' | 'partial' | 'paid';
  public items!: IOrderItem[];
  public subtotal!: number;
  public taxAmount!: number;
  public discountAmount!: number;
  public totalAmount!: number;
  public paidAmount!: number;
  public balanceAmount!: number;
  public paymentMethod?: string;
  public deliveryAddress?: string;
  public customerNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;
}

Order.init(
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
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Customers',
        key: 'id',
      },
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    orderType: {
      type: DataTypes.ENUM('retail', 'wholesale'),
      defaultValue: 'retail',
    },
    orderStatus: {
      type: DataTypes.ENUM('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
      defaultValue: 'unpaid',
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'Orders',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['orderNumber'] },
      { fields: ['shopId'] },
      { fields: ['customerId'] },
      { fields: ['orderStatus'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Order;
