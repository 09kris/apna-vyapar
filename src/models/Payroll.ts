import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface IPayroll {
  id?: number;
  shopId: number;
  employeeId: number;
  salaryMonth: string;
  basicSalary: number;
  hra: number;
  medicalAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  pfDeduction: number;
  taxDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  leaveDays: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonus: number;
  paymentStatus: 'pending' | 'paid' | 'hold';
  paymentDate?: Date;
  paymentMode?: string;
  paymentReference?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Payroll extends Model<IPayroll> implements IPayroll {
  public id!: number;
  public shopId!: number;
  public employeeId!: number;
  public salaryMonth!: string;
  public basicSalary!: number;
  public hra!: number;
  public medicalAllowance!: number;
  public transportAllowance!: number;
  public otherAllowances!: number;
  public grossSalary!: number;
  public pfDeduction!: number;
  public taxDeduction!: number;
  public loanDeduction!: number;
  public otherDeductions!: number;
  public totalDeductions!: number;
  public netSalary!: number;
  public workingDays!: number;
  public leaveDays!: number;
  public overtimeHours!: number;
  public overtimeAmount!: number;
  public bonus!: number;
  public paymentStatus!: 'pending' | 'paid' | 'hold';
  public paymentDate?: Date;
  public paymentMode?: string;
  public paymentReference?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;
}

Payroll.init(
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
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Employees',
        key: 'id',
      },
    },
    salaryMonth: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    basicSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    hra: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    medicalAllowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    transportAllowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    otherAllowances: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    grossSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    pfDeduction: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    taxDeduction: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    loanDeduction: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    otherDeductions: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    netSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    workingDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leaveDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    overtimeAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    bonus: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'hold'),
      defaultValue: 'pending',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentMode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Payroll',
    tableName: 'Payrolls',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['employeeId'] },
      { fields: ['shopId'] },
      { fields: ['salaryMonth'] },
      { fields: ['paymentStatus'] },
    ],
  }
);

export default Payroll;
