import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface CategoryAttributes {
  categoryId: string;
  shopId: string;
  categoryName: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes
  extends Optional<CategoryAttributes, 'categoryId' | 'sortOrder' | 'isActive'> {}

class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public categoryId!: string;
  public shopId!: string;
  public categoryName!: string;
  public description?: string;
  public imageUrl?: string;
  public sortOrder?: number;
  public isActive?: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Category.init(
  {
    categoryId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoryName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING(255),
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
  },
  {
    sequelize,
    tableName: 'Categories',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['isActive'] },
    ],
  }
);

export default Category;
