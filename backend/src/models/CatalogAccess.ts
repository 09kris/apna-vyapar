import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface CatalogAccessAttributes {
  accessId: string;
  shopId: string;
  referralCode: string;
  visitorIp?: string;
  visitorLocation?: any; // JSON object with city, state, country
  hasGst: boolean;
  gstNumber?: string;
  gstVerified: boolean;
  viewingMode: 'Retail' | 'Wholesale';
  productsViewed?: string[]; // Array of product IDs
  cartValue?: number;
  orderPlaced: boolean;
  orderId?: string;
  sessionDuration?: number; // in seconds
  deviceType?: string;
  browser?: string;
  accessedAt: Date;
  lastActivity?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CatalogAccessCreationAttributes
  extends Optional<CatalogAccessAttributes, 'accessId' | 'hasGst' | 'gstVerified' | 'orderPlaced' | 'accessedAt'> {}

class CatalogAccess
  extends Model<CatalogAccessAttributes, CatalogAccessCreationAttributes>
  implements CatalogAccessAttributes
{
  public accessId!: string;
  public shopId!: string;
  public referralCode!: string;
  public visitorIp?: string;
  public visitorLocation?: any;
  public hasGst!: boolean;
  public gstNumber?: string;
  public gstVerified!: boolean;
  public viewingMode!: 'Retail' | 'Wholesale';
  public productsViewed?: string[];
  public cartValue?: number;
  public orderPlaced!: boolean;
  public orderId?: string;
  public sessionDuration?: number;
  public deviceType?: string;
  public browser?: string;
  public accessedAt!: Date;
  public lastActivity?: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

CatalogAccess.init(
  {
    accessId: {
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
    },
    visitorIp: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    visitorLocation: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    hasGst: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    gstNumber: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    gstVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    viewingMode: {
      type: DataTypes.ENUM('Retail', 'Wholesale'),
      allowNull: false,
    },
    productsViewed: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    cartValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    orderPlaced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    sessionDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    browser: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    accessedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'CatalogAccess',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['referralCode'] },
      { fields: ['accessedAt'] },
      { fields: ['viewingMode'] },
    ],
  }
);

export default CatalogAccess;