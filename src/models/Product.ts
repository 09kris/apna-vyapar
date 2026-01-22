import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface IProduct {
  id?: number;
  shopId: number;
  categoryId: number;
  productCode: string;
  productName: string;
  description?: string;
  brand?: string;
  retailPrice: number;
  wholesalePrice: number;
  costPrice: number;
  mrp: number;
  taxPercentage: number;
  discountPercentage: number;
  stockQuantity: number;
  reorderLevel: number;
  maxStockLevel: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  warrantyMonths?: number;
  returnDays?: number;
  barcodeNumber?: string;
  skuNumber?: string;
  tags?: string;
  isFeatured: boolean;
  expiryDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Product extends Model<IProduct> implements IProduct {
  public id!: number;
  public shopId!: number;
  public categoryId!: number;
  public productCode!: string;
  public productName!: string;
  public description?: string;
  public brand?: string;
  public retailPrice!: number;
  public wholesalePrice!: number;
  public costPrice!: number;
  public mrp!: number;
  public taxPercentage!: number;
  public discountPercentage!: number;
  public stockQuantity!: number;
  public reorderLevel!: number;
  public maxStockLevel!: number;
  public unit!: string;
  public weight?: number;
  public dimensions?: string;
  public warrantyMonths?: number;
  public returnDays?: number;
  public barcodeNumber?: string;
  public skuNumber?: string;
  public tags?: string;
  public isFeatured!: boolean;
  public expiryDate?: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;
}

Product.init(
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
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id',
      },
    },
    productCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    retailPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    wholesalePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    costPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    mrp: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    taxPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    maxStockLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    dimensions: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    warrantyMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    returnDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    barcodeNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    skuNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expiryDate: {
      type: DataTypes.DATE,
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
    modelName: 'Product',
    tableName: 'Products',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['categoryId'] },
      { fields: ['productCode'] },
      { fields: ['productName'] },
    ],
  }
);

export default Product;
