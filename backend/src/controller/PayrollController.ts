import { Request, Response } from 'express';
import Payroll from '../models/Payroll';
import Employee from '../models/Employee';
import Shop from '../models/Shop';
import CustomFormField from '../models/CustomFormField';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* =====================================
   CONFIGURE PAYROLL FIELDS
===================================== */
export const configurePayrollFields = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { fields } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!Array.isArray(fields)) throw new ApiError(400, 'Fields must be an array');

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) {
    throw new ApiError(403, 'Unauthorized: You can only configure your own shop');
  }

  let config = await CustomFormField.findOne({
    where: { shopId, tableName: 'Payroll' },
  });

  if (config) {
    await config.update({
      fields: JSON.stringify(fields),
      updatedBy: userId,
    });
  } else {
    config = await CustomFormField.create({
      shopId,
      tableName: 'Payroll',
      fields: JSON.stringify(fields),
      status: 'ACTIVE',
      createdBy: userId,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fieldId: config.fieldId,
        shopId: config.shopId,
        tableName: config.tableName,
        fieldsCount: fields.length,
        status: config.status,
      },
      'Payroll fields configured successfully',
    ),
  );
});

/* =====================================
   GET PAYROLL FIELD CONFIG
===================================== */
export const getPayrollFieldConfiguration = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const config = await CustomFormField.findOne({
    where: { shopId, tableName: 'Payroll' },
  });

  if (!config) {
    throw new ApiError(404, 'No payroll configuration found for this shop');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fieldId: config.fieldId,
        shopId: config.shopId,
        tableName: config.tableName,
        fields: JSON.parse(config.fields),
        status: config.status,
      },
      'Payroll field configuration retrieved successfully',
    ),
  );
});

/* =====================================
   GENERATE PAYROLL
===================================== */
export const generatePayroll = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const shop = await Shop.findByPk(shopId);
  if (!shop || shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  const {
    employeeId,
    salaryMonth,
    basicSalary,
    hra = 0,
    medicalAllowance = 0,
    transportAllowance = 0,
    otherAllowances = 0,
    pfDeduction = 0,
    taxDeduction = 0,
    loanDeduction = 0,
    otherDeductions = 0,
    workingDays,
    leaveDays = 0,
    overtimeHours = 0,
    overtimeAmount = 0,
    bonus = 0,
  } = req.body;

  if (!employeeId || !salaryMonth || !basicSalary || !workingDays) {
    throw new ApiError(400, 'Missing required payroll fields');
  }

  const employee = await Employee.findByPk(employeeId);
  if (!employee || employee.shopId !== shopId) {
    throw new ApiError(400, 'Invalid employee');
  }

  const grossSalary =
    Number(basicSalary) +
    Number(hra) +
    Number(medicalAllowance) +
    Number(transportAllowance) +
    Number(otherAllowances) +
    Number(overtimeAmount) +
    Number(bonus);

  const totalDeductions =
    Number(pfDeduction) +
    Number(taxDeduction) +
    Number(loanDeduction) +
    Number(otherDeductions);

  const netSalary = grossSalary - totalDeductions;

  const payroll = await Payroll.create({
    shopId,
    employeeId,
    salaryMonth,
    basicSalary,
    hra,
    medicalAllowance,
    transportAllowance,
    otherAllowances,
    grossSalary,
    pfDeduction,
    taxDeduction,
    loanDeduction,
    otherDeductions,
    totalDeductions,
    netSalary,
    workingDays,
    leaveDays,
    overtimeHours,
    overtimeAmount,
    bonus,
    generatedBy: userId,
  });

  return res.status(201).json(
    new ApiResponse(201, payroll, 'Payroll generated successfully'),
  );
});
