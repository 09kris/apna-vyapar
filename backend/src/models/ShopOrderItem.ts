import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type OrderItemStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

interface OrderItemAttributes {
  orderItemId: string;
  orderId: string;
  productId: string;

  productName: string;
  productCode?: string;

  quantity: number;
  unitPrice: number;

  discountPercentage?: number;
  discountAmount?: number;

  taxPercentage?: number;
  taxAmount?: number;

  subtotal: number;
  totalPrice: number;

  itemStatus: OrderItemStatus; // 👈 PRODUCT-WISE STATUS
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderItemCreationAttributes
  extends Optional<
    OrderItemAttributes,
    | 'orderItemId'
    | 'discountPercentage'
    | 'discountAmount'
    | 'taxPercentage'
    | 'taxAmount'
    | 'notes'
  > {}

class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes
{
  public orderItemId!: string;
  public orderId!: string;
  public productId!: string;

  public productName!: string;
  public productCode?: string;

  public quantity!: number;
  public unitPrice!: number;

  public discountPercentage?: number;
  public discountAmount?: number;

  public taxPercentage?: number;
  public taxAmount?: number;

  public subtotal!: number;
  public totalPrice!: number;

  public itemStatus!: OrderItemStatus;
  public notes?: string;

  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

OrderItem.init(
  {
    orderItemId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    productCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    taxPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    itemStatus: {
      type: DataTypes.ENUM(
        'PENDING',
        'CONFIRMED',
        'PACKED',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
      ),
      defaultValue: 'PENDING',
    },
    notes: DataTypes.TEXT,
  },
  {
    sequelize,
    tableName: 'OrderItems',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['productId'] },
      { fields: ['itemStatus'] },
    ],
  },
);

export default OrderItem;
