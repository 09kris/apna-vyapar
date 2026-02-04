import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ShopOwnerAttributes {
  ownerId: string;
  userId: string;
  businessName: string;
  businessType?: string;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessZipCode?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  businessLogo?: string;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  bankIfscCode?: string;
  isVerified: boolean;
  verificationDocuments?: string;
  verificationDate?: Date;
  verifiedBy?: string;
  subscriptionPlan?: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  isSubscriptionActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShopOwnerCreationAttributes extends Optional<ShopOwnerAttributes, 'ownerId'> {}

class ShopOwner extends Model<ShopOwnerAttributes, ShopOwnerCreationAttributes> implements ShopOwnerAttributes {
  public ownerId!: string;
  public userId!: string;
  public businessName!: string;
  public businessType?: string;
  public businessRegistrationNumber?: string;
  public taxIdentificationNumber?: string;
  public businessAddress?: string;
  public businessCity?: string;
  public businessState?: string;
  public businessZipCode?: string;
  public businessPhone?: string;
  public businessEmail?: string;
  public businessWebsite?: string;
  public businessLogo?: string;
  public bankAccountHolderName?: string;
  public bankAccountNumber?: string;
  public bankBranchCode?: string;
  public bankIfscCode?: string;
  public isVerified!: boolean;
  public verificationDocuments?: string;
  public verificationDate?: Date;
  public verifiedBy?: string;
  public subscriptionPlan?: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  public subscriptionStartDate?: Date;
  public subscriptionEndDate?: Date;
  public isSubscriptionActive!: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

ShopOwner.init(
  {
    ownerId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    businessType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    businessRegistrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    taxIdentificationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    businessCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    businessState: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    businessZipCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    businessPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    businessEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    businessWebsite: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    businessLogo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    bankAccountHolderName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bankBranchCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    bankIfscCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verificationDocuments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    subscriptionPlan: {
      type: DataTypes.ENUM('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'),
      allowNull: true,
      defaultValue: 'FREE',
    },
    subscriptionStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isSubscriptionActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'ShopOwners',
    timestamps: true,
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['businessEmail'] },
      { fields: ['isVerified'] },
      { fields: ['subscriptionPlan'] },
    ],
  },
);

export default ShopOwner;
