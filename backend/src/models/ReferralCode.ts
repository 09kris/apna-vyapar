import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ReferralCodeAttributes {
  referralId: string;
  shopId: string;
  referralCode: string;
  name: string;
  description?: string;
  selectionType: 'categories' | 'products';
  selectedCategories?: string[]; // Array of category IDs
  selectedProducts?: string[]; // Array of product IDs
  isActive: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReferralCodeCreationAttributes
  extends Optional<ReferralCodeAttributes, 'referralId' | 'isActive'> {}

class ReferralCode
  extends Model<ReferralCodeAttributes, ReferralCodeCreationAttributes>
  implements ReferralCodeAttributes
{
  public referralId!: string;
  public shopId!: string;
  public referralCode!: string;
  public name!: string;
  public description?: string;
  public selectionType!: 'categories' | 'products';
  public selectedCategories?: string[];
  public selectedProducts?: string[];
  public isActive!: boolean;
  public createdBy!: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

ReferralCode.init(
  {
    referralId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    selectionType: {
      type: DataTypes.ENUM('categories', 'products'),
      allowNull: false,
    },
    selectedCategories: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    selectedProducts: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ReferralCodes',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['referralCode'], unique: true },
      { fields: ['isActive'] },
    ],
  }
);

export default ReferralCode;