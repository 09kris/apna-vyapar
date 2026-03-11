import { Request, Response } from 'express';
import Payroll from '../models/Payroll';
import Employee from '../models/Employee';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import CustomFormField from '../models/CustomFormField';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';
import { Op } from 'sequelize';

/* =====================================
   HELPERS
===================================== */

const verifyShopAccess = async (userId: string, shopId: string) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  // First, look up the ShopOwner by userId to get the correct ownerId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  
  // Check if user is the shop owner (compare shopOwner.ownerId with shop.ownerId)
  if (shopOwner && shop.ownerId === shopOwner.ownerId) {
    return shop;
  }

  // Check if user is an active employee of the shop
  const employee = await Employee.findOne({
    where: {
      userId: userId,
      shopId: shopId,
      isActive: true
    }
  });

  if (!employee) {
    throw new ApiError(403, 'Unauthorized - not a shop owner or active employee');
  }

  return shop;
};
export const configurePayrollFields = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { fields } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!Array.isArray(fields)) throw new ApiError(400, 'Fields must be an array');

  await verifyShopAccess(userId, shopId);

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

  await verifyShopAccess(userId, shopId);

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

/* =====================================
   GET PAYROLLS BY SHOP
===================================== */
export const getPayrollsByShop = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { month, employeeId, page = 1, limit = 10 } = req.query;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  await verifyShopAccess(userId, shopId);

  const where: any = { shopId };
  
  if (month) {
    where.salaryMonth = String(month);
  }
  
  if (employeeId) {
    where.employeeId = String(employeeId);
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: payrolls } = await Payroll.findAndCountAll({
    where,
    include: [
      {
        model: Employee,
        as: 'employee',
        include: [
          {
            association: 'user',
            attributes: ['id', 'fullName', 'email', 'phone']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: payrolls,
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
      'Payrolls retrieved successfully',
    ),
  );
});

/* =====================================
   GET SINGLE PAYROLL
===================================== */
export const getPayrollById = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { payrollId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const payroll = await Payroll.findByPk(payrollId, {
    include: [
      {
        model: Employee,
        as: 'employee',
        include: [
          {
            association: 'user',
            attributes: ['id', 'fullName', 'email', 'phone']
          }
        ]
      }
    ],
  });

  if (!payroll) {
    throw new ApiError(404, 'Payroll not found');
  }

  const shop = await Shop.findByPk(payroll.shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  await verifyShopAccess(userId, payroll.shopId);

  return res.status(200).json(
    new ApiResponse(200, payroll, 'Payroll retrieved successfully'),
  );
});

/* =====================================
   UPDATE PAYROLL PAYMENT STATUS
===================================== */
export const updatePayrollPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { payrollId } = (req as any).params;
  const { paymentStatus, paymentDate, paymentMode, paymentReference } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const payroll = await Payroll.findByPk(payrollId);
  if (!payroll) {
    throw new ApiError(404, 'Payroll not found');
  }

  const shop = await Shop.findByPk(payroll.shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  await verifyShopAccess(userId, payroll.shopId);

  await payroll.update({
    paymentStatus,
    paymentDate: paymentDate ? new Date(paymentDate) : undefined,
    paymentMode,
    paymentReference,
  });

  return res.status(200).json(
    new ApiResponse(200, payroll, 'Payment status updated successfully'),
  );
});

/* =====================================
   DELETE PAYROLL
===================================== */
export const deletePayroll = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { payrollId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const payroll = await Payroll.findByPk(payrollId);
  if (!payroll) {
    throw new ApiError(404, 'Payroll not found');
  }

  const shop = await Shop.findByPk(payroll.shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  await verifyShopAccess(userId, payroll.shopId);

  await payroll.destroy();

  return res.status(200).json(
    new ApiResponse(200, null, 'Payroll deleted successfully'),
  );
});
