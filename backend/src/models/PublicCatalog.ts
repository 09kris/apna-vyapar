import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface PublicCatalogAttributes {
  catalogId: string;
  shopId: string;
  isEnabled: boolean;
  description?: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PublicCatalogCreationAttributes
  extends Optional<PublicCatalogAttributes, 'catalogId' | 'isEnabled'> {}

class PublicCatalog
  extends Model<PublicCatalogAttributes, PublicCatalogCreationAttributes>
  implements PublicCatalogAttributes
{
  public catalogId!: string;
  public shopId!: string;
  public isEnabled!: boolean;
  public description?: string;
  public createdBy!: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

PublicCatalog.init(
  {
    catalogId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'PublicCatalogs',
    timestamps: true,
    indexes: [
      { fields: ['shopId'], unique: true },
      { fields: ['isEnabled'] },
    ],
  }
);

export default PublicCatalog;