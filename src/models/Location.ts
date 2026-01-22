import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface ILocation {
  id?: number;
  shopId: number;
  city: string;
  area: string;
  landmark?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Location extends Model<ILocation> implements ILocation {
  public id!: number;
  public shopId!: number;
  public city!: string;
  public area!: string;
  public landmark?: string;
  public pincode!: string;
  public latitude!: number;
  public longitude!: number;
  public isPrimary!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;
}

Location.init(
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
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    area: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    landmark: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Location',
    tableName: 'Locations',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['city'] },
      { fields: ['latitude', 'longitude'] },
    ],
  }
);

export default Location;
