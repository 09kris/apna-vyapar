import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface IEmployee {
  id?: number;
  shopId: number;
  userId?: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'freelance';
  salary: number;
  joiningDate: Date;
  probationEndDate?: Date;
  reportingTo?: number;
  aadhaarNumber?: string;
  panNumber?: string;
  bankAccount?: string;
  bankIfsc?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  isActive: boolean;
  terminationDate?: Date;
  terminationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Employee extends Model<IEmployee> implements IEmployee {
  public id!: number;
  public shopId!: number;
  public userId?: number;
  public employeeCode!: string;
  public fullName!: string;
  public email!: string;
  public phone!: string;
  public designation!: string;
  public department!: string;
  public employmentType!: 'full-time' | 'part-time' | 'contract' | 'freelance';
  public salary!: number;
  public joiningDate!: Date;
  public probationEndDate?: Date;
  public reportingTo?: number;
  public aadhaarNumber?: string;
  public panNumber?: string;
  public bankAccount?: string;
  public bankIfsc?: string;
  public emergencyContact?: string;
  public emergencyContactName?: string;
  public isActive!: boolean;
  public terminationDate?: Date;
  public terminationReason?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;
}

Employee.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    employmentType: {
      type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'freelance'),
      defaultValue: 'full-time',
    },
    salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    joiningDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    probationEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reportingTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Employees',
        key: 'id',
      },
    },
    aadhaarNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    panNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bankAccount: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bankIfsc: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    emergencyContactName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    terminationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    terminationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Employee',
    tableName: 'Employees',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['employeeCode'] },
      { fields: ['userId'] },
      { fields: ['reportingTo'] },
    ],
  }
);

export default Employee;
