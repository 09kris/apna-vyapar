import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface EnquiryAttributes {
  enquiryId: string;
  shopId: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  subject: string;
  message: string;
  status: 'New' | 'InProgress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  assignedTo?: string;
  responseMessage?: string;
  respondedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EnquiryCreationAttributes
  extends Optional<EnquiryAttributes, 'enquiryId' | 'status' | 'priority'> {}

class Enquiry
  extends Model<EnquiryAttributes, EnquiryCreationAttributes>
  implements EnquiryAttributes
{
  public enquiryId!: string;
  public shopId!: string;
  public customerId?: string;
  public customerName!: string;
  public customerEmail?: string;
  public customerPhone!: string;
  public subject!: string;
  public message!: string;
  public status!: 'New' | 'InProgress' | 'Resolved' | 'Closed';
  public priority!: 'Low' | 'Normal' | 'High' | 'Urgent';
  public assignedTo?: string;
  public responseMessage?: string;
  public respondedAt?: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Enquiry.init(
  {
    enquiryId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('New', 'InProgress', 'Resolved', 'Closed'),
      defaultValue: 'New',
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Normal', 'High', 'Urgent'),
      defaultValue: 'Normal',
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    responseMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Enquiries',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['customerId'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Enquiry;

