import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface CartAttributes {
  cartId: string;
  userId: string;
  shopId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CartCreationAttributes extends Optional<CartAttributes, 'cartId' | 'createdAt' | 'updatedAt'> {}

class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  public cartId!: string;
  public userId!: string;
  public shopId!: string;
  public productId!: string;
  public quantity!: number;
  public unitPrice!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Cart.init(
  {
    cartId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Carts',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['shopId'] },
      { fields: ['productId'] },
      { fields: ['userId', 'shopId'] },
      { fields: ['userId', 'productId'] },
    ],
  },
);

export default Cart;

