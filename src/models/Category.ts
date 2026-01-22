import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface ICategory {
  id?: number;
  shopId: number;
  categoryName: string;
  description?: string;
  parentCategoryId?: number;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Category extends Model<ICategory> implements ICategory {
  public id!: number;
  public shopId!: number;
  public categoryName!: string;
  public description?: string;
  public parentCategoryId?: number;
  public imageUrl?: string;
  public sortOrder!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;
}

Category.init(
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
    categoryName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parentCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Categories',
        key: 'id',
      },
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    modelName: 'Category',
    tableName: 'Categories',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['parentCategoryId'] },
    ],
  }
);

export default Category;
