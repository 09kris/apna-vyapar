import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ProductAttributes {
  productId: string;
  shopId: string;
  categoryId: string;
  productCode?: string;
  productName: string;
  description?: string;
  brand?: string;
  manufacturer?: string;
  retailPrice: number;
  wholesalePrice: number;
  costPrice?: number;
  mrp?: number;
  discountPercentage?: number;
  taxPercentage?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  imageUrl?: string;
  galleryImages?: any;
  tags?: any;
  isFeatured?: boolean;
  isActive?: boolean;
  expiryDate?: Date;
  batchNumber?: string;
  warrantyMonths?: number;
  returnDays?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes
  extends Optional<
    ProductAttributes,
    | 'productId'
    | 'discountPercentage'
    | 'taxPercentage'
    | 'stockQuantity'
    | 'reorderLevel'
    | 'isFeatured'
    | 'isActive'
    | 'returnDays'
  > {}

class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public productId!: string;
  public shopId!: string;
  public categoryId!: string;
  public productCode?: string;
  public productName!: string;
  public description?: string;
  public brand?: string;
  public manufacturer?: string;
  public retailPrice!: number;
  public wholesalePrice!: number;
  public costPrice?: number;
  public mrp?: number;
  public discountPercentage?: number;
  public taxPercentage?: number;
  public stockQuantity?: number;
  public reorderLevel?: number;
  public maxStockLevel?: number;
  public unit!: string;
  public weight?: number;
  public dimensions?: string;
  public imageUrl?: string;
  public galleryImages?: any;
  public tags?: any;
  public isFeatured?: boolean;
  public isActive?: boolean;
  public expiryDate?: Date;
  public batchNumber?: string;
  public warrantyMonths?: number;
  public returnDays?: number;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Product.init(
  {
    productId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productCode: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
    },
    productName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    retailPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    wholesalePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    taxPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maxStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    dimensions: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    galleryImages: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    batchNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    warrantyMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    returnDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'Products',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['categoryId'] },
      { fields: ['productCode'], unique: true },
      { fields: ['isActive'] },
    ],
  }
);

export default Product;
