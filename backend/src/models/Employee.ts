import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type StaffRole = 'Owner' | 'Admin' | 'Manager' | 'Staff';

export interface StaffPermission {
  canViewProducts: boolean;
  canAddProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canViewCustomers: boolean;
  canAddCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;
  canViewEmployees: boolean;
  canManageEmployees: boolean;
  canViewInventory: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canViewAccounting: boolean;
  canManageAccounting: boolean;
}

export const DEFAULT_PERMISSIONS: Record<StaffRole, StaffPermission> = {
  Owner: {
    canViewProducts: true,
    canAddProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewCustomers: true,
    canAddCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    canViewOrders: true,
    canManageOrders: true,
    canViewEmployees: true,
    canManageEmployees: true,
    canViewInventory: true,
    canManageInventory: true,
    canViewReports: true,
    canManageSettings: true,
    canViewAccounting: true,
    canManageAccounting: true,
  },
  Admin: {
    canViewProducts: true,
    canAddProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewCustomers: true,
    canAddCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    canViewOrders: true,
    canManageOrders: true,
    canViewEmployees: true,
    canManageEmployees: true,
    canViewInventory: true,
    canManageInventory: true,
    canViewReports: true,
    canManageSettings: true,
    canViewAccounting: true,
    canManageAccounting: true,
  },
  Manager: {
    canViewProducts: true,
    canAddProducts: true,
    canEditProducts: true,
    canDeleteProducts: false,
    canViewCustomers: true,
    canAddCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: false,
    canViewOrders: true,
    canManageOrders: true,
    canViewEmployees: true,
    canManageEmployees: false,
    canViewInventory: true,
    canManageInventory: true,
    canViewReports: true,
    canManageSettings: false,
    canViewAccounting: true,
    canManageAccounting: true,
  },
  Staff: {
    canViewProducts: true,
    canAddProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewCustomers: true,
    canAddCustomers: true,
    canEditCustomers: false,
    canDeleteCustomers: false,
    canViewOrders: true,
    canManageOrders: false,
    canViewEmployees: false,
    canManageEmployees: false,
    canViewInventory: true,
    canManageInventory: false,
    canViewReports: false,
    canManageSettings: false,
    canViewAccounting: false,
    canManageAccounting: false,
  },
};

interface EmployeeAttributes {
  employeeId: string;
  shopId: string;
  userId?: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  employeeType?: 'WORKER' | 'MANAGER';
  staffRole: StaffRole;
  permissions?: StaffPermission;
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
  // User details fields (filled by shop owner)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'employeeId' | 'isActive' | 'staffRole'> {}

class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  public employeeId!: string;
  public shopId!: string;
  public userId?: string;
  public employeeCode?: string;
  public designation?: string;
  public department?: string;
  public employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  public employeeType?: 'WORKER' | 'MANAGER';
  public staffRole!: StaffRole;
  public permissions?: StaffPermission;
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
  // User details fields
  public firstName?: string;
  public lastName?: string;
  public email?: string;
  public phone?: string;
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
      allowNull: true,
    },
    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
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
    employeeType: {
      type: DataTypes.ENUM('WORKER', 'MANAGER'),
      allowNull: true,
      defaultValue: 'WORKER',
    },
    staffRole: {
      type: DataTypes.ENUM('Owner', 'Admin', 'Manager', 'Staff'),
      allowNull: false,
      defaultValue: 'Staff',
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
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
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
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
      { fields: ['staffRole'] },
    ],
  },
);

export default Employee;
