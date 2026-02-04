import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
export type PaymentMode = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';

interface PayrollAttributes {
  payrollId: string;
  employeeId: string;
  shopId: string;
  salaryMonth: string;

  basicSalary: number;
  hra?: number;
  medicalAllowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;

  grossSalary: number;

  pfDeduction?: number;
  taxDeduction?: number;
  loanDeduction?: number;
  otherDeductions?: number;
  totalDeductions: number;

  netSalary: number;

  workingDays: number;
  leaveDays?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  bonus?: number;

  paymentStatus: PaymentStatus;
  paymentDate?: Date;
  paymentMode?: PaymentMode;
  paymentReference?: string;

  remarks?: string;
  generatedBy: string;

  createdAt?: Date;
  updatedAt?: Date;
}

interface PayrollCreationAttributes
  extends Optional<
    PayrollAttributes,
    | 'payrollId'
    | 'hra'
    | 'medicalAllowance'
    | 'transportAllowance'
    | 'otherAllowances'
    | 'pfDeduction'
    | 'taxDeduction'
    | 'loanDeduction'
    | 'otherDeductions'
    | 'leaveDays'
    | 'overtimeHours'
    | 'overtimeAmount'
    | 'bonus'
    | 'paymentStatus'
    | 'paymentDate'
    | 'paymentMode'
    | 'paymentReference'
    | 'remarks'
  > {}

class Payroll
  extends Model<PayrollAttributes, PayrollCreationAttributes>
  implements PayrollAttributes
{
  public payrollId!: string;
  public employeeId!: string;
  public shopId!: string;
  public salaryMonth!: string;

  public basicSalary!: number;
  public hra?: number;
  public medicalAllowance?: number;
  public transportAllowance?: number;
  public otherAllowances?: number;

  public grossSalary!: number;

  public pfDeduction?: number;
  public taxDeduction?: number;
  public loanDeduction?: number;
  public otherDeductions?: number;
  public totalDeductions!: number;

  public netSalary!: number;

  public workingDays!: number;
  public leaveDays?: number;
  public overtimeHours?: number;
  public overtimeAmount?: number;
  public bonus?: number;

  public paymentStatus!: PaymentStatus;
  public paymentDate?: Date;
  public paymentMode?: PaymentMode;
  public paymentReference?: string;

  public remarks?: string;
  public generatedBy!: string;

  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Payroll.init(
  {
    payrollId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    salaryMonth: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    basicSalary: {
      type: DataTypes.DECIMAL(10, 2)
    },
    hra: DataTypes.DECIMAL(10, 2),
    medicalAllowance: DataTypes.DECIMAL(10, 2),
    transportAllowance: DataTypes.DECIMAL(10, 2),
    otherAllowances: DataTypes.DECIMAL(10, 2),

    grossSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    pfDeduction: DataTypes.DECIMAL(10, 2),
    taxDeduction: DataTypes.DECIMAL(10, 2),
    loanDeduction: DataTypes.DECIMAL(10, 2),
    otherDeductions: DataTypes.DECIMAL(10, 2),

    totalDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    netSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    workingDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leaveDays: DataTypes.INTEGER,
    overtimeHours: DataTypes.DECIMAL(5, 2),
    overtimeAmount: DataTypes.DECIMAL(10, 2),
    bonus: DataTypes.DECIMAL(10, 2),

    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'),
      defaultValue: 'PENDING',
    },
    paymentDate: DataTypes.DATE,
    paymentMode: {
      type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'),
    },
    paymentReference: DataTypes.STRING(50),

    remarks: DataTypes.TEXT,
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Payrolls',
    timestamps: true,
    indexes: [
      { fields: ['shopId'] },
      { fields: ['employeeId'] },
      { fields: ['salaryMonth'] },
      { fields: ['paymentStatus'] },
    ],
  },
);

export default Payroll;
