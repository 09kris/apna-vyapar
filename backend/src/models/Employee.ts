import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface EmployeeAttributes {
  employeeId: string;
  shopId: string;
  userId: string;
  designation?: string;
  department?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salary?: number;
  joiningDate?: Date;
  probationEndDate?: Date;
  reportingTo?: string;
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
}

interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'employeeId' | 'isActive'> {}

class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  public employeeId!: string;
  public shopId!: string;
  public userId!: string;
  public designation?: string;
  public department?: string;
  public employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  public salary?: number;
  public joiningDate?: Date;
  public probationEndDate?: Date;
  public reportingTo?: string;
  public aadhaarNumber?: string;
  public panNumber?: string;
  public bankAccount?: string;
  public bankIfsc?: string;
  public emergencyContact?: string;
  public emergencyContactName?: string;
  public isActive!: boolean;
  public terminationDate?: Date;
  public terminationReason?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Employee.init(
  {
    employeeId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    employmentType: {
      type: DataTypes.ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'),
      allowNull: true,
      defaultValue: 'FULL_TIME',
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    joiningDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    probationEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reportingTo: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    aadhaarNumber: {
      type: DataTypes.STRING(12),
      allowNull: true,
      unique: true,
    },
    panNumber: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: true,
    },
    bankAccount: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    bankIfsc: {
      type: DataTypes.STRING(11),
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    emergencyContactName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: 'Employees',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['userId'] },
      { fields: ['isActive'] },
      { fields: ['shopId', 'isActive'] },
    ],
  },
);

export default Employee;
