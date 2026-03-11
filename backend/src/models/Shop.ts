import { ReferenceType } from './Invectory';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ShopAttributes {
  shopId: string;
  ownerId: string;
  shopName: string;
  shopDescription?: string;
  shopCategory?: string;
  shopType: 'RETAIL' | 'WHOLESALE' | 'ECOMMERCE' | 'FRANCHISE' | 'OTHER';
  shopLogo?: string;
  shopBanner?: string;
  phoneNumber: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  isActive: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  verifiedBy?: string;
  totalProducts?: number;
  totalOrders?: number;
  rating?: number;
  totalReviews?: number;
  establishedYear?: number;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranchCode?: string;
  bankIfscCode?: string;
  upiId?: string;
  referenceCode?: string;
  referralCode?: string;
  publicView?: boolean;
  // Tax details
  gstNumber?: string;
  panNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShopCreationAttributes extends Optional<ShopAttributes, 'shopId' | 'isActive' | 'isVerified' | 'totalProducts' | 'totalOrders' | 'totalReviews'> {}

class Shop extends Model<ShopAttributes, ShopCreationAttributes> implements ShopAttributes {
  public shopId!: string;
  public ownerId!: string;
  public shopName!: string;
  public shopDescription?: string;
  public shopCategory?: string;
  public shopType!: 'RETAIL' | 'WHOLESALE' | 'ECOMMERCE' | 'FRANCHISE' | 'OTHER';
  public shopLogo?: string;
  public shopBanner?: string;
  public phoneNumber!: string;
  public email!: string;
  public website?: string;
  public address!: string;
  public city!: string;
  public state!: string;
  public zipCode!: string;
  public country!: string;
  public latitude?: number;
  public longitude?: number;
  public businessHoursStart?: string;
  public businessHoursEnd?: string;
  public isActive!: boolean;
  public isVerified!: boolean;
  public verificationDate?: Date;
  public verifiedBy?: string;
  public totalProducts?: number;
  public totalOrders?: number;
  public rating?: number;
  public totalReviews?: number;
  public establishedYear?: number;
  public bankAccountHolderName?: string;
  public bankAccountNumber?: string;
  public bankName?: string;
  public bankBranchCode?: string;
  public bankIfscCode?: string;
  public upiId?: string;
  public referenceCode?: string;
  public referralCode?: string;
  public publicView?: boolean;
  // Tax details
  public gstNumber?: string;
  public panNumber?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Shop.init(
  {
    shopId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shopName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    shopDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shopCategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shopType: {
      type: DataTypes.ENUM('RETAIL', 'WHOLESALE', 'ECOMMERCE', 'FRANCHISE', 'OTHER'),
      allowNull: false,
      defaultValue: 'RETAIL',
    },
    shopLogo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    shopBanner: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    businessHoursStart: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    businessHoursEnd: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    totalProducts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    establishedYear: {
      type: DataTypes.INTEGER,
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
    bankName: {
      type: DataTypes.STRING(100),
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
    upiId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    referenceCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    publicView: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Tax details
    gstNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    panNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Shops',
    timestamps: true,
    indexes: [
      { fields: ['ownerId'] },
      { fields: ['email'], unique: true },
      { fields: ['city'] },
      { fields: ['isActive'] },
      { fields: ['isVerified'] },
      { fields: ['shopType'] },
      { fields: ['ownerId', 'isActive'] },
      { fields: ['referralCode'], unique: true },
    ],
  },
);

export default Shop;
