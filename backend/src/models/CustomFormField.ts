import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface CustomFormFieldAttributes {
  fieldId: string;
  shopId: string;
  tableName: string;
  fields: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomFormFieldCreationAttributes extends Optional<CustomFormFieldAttributes, 'fieldId'> {}

class CustomFormField extends Model<CustomFormFieldAttributes, CustomFormFieldCreationAttributes> implements CustomFormFieldAttributes {
  public fieldId!: string;
  public shopId!: string;
  public tableName!: string;
  public fields!: string;
  public status!: 'ACTIVE' | 'INACTIVE';
  public createdBy!: string;
  public updatedBy?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

CustomFormField.init(
  {
    fieldId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tableName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fields: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of field objects with name, type, required, etc.',
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'CustomFormFields',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['tableName'] },
      { fields: ['shopId', 'tableName'] },
    ],
  },
);

export default CustomFormField;
