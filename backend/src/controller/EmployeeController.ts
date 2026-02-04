import { Request, Response } from 'express';
import CustomFormField from '../models/CustomFormField';
import Employee from '../models/Employee';
import Shop from '../models/Shop';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* ==============================
   CONFIGURE EMPLOYEE FIELDS
============================== */
export const configureEmployeeFields = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const { fields } = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!Array.isArray(fields)) throw new ApiError(400, 'Fields must be an array');

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) {
    throw new ApiError(403, 'Unauthorized: You can only configure fields for your own shops');
  }

  let formField = await CustomFormField.findOne({
    where: { shopId, tableName: 'Employee' },
  });

  if (formField) {
    await formField.update({
      fields: JSON.stringify(fields),
      updatedBy: userId,
    });
  } else {
    formField = await CustomFormField.create({
      shopId,
      tableName: 'Employee',
      fields: JSON.stringify(fields),
      status: 'ACTIVE',
      createdBy: userId,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fieldId: formField.fieldId,
        shopId: formField.shopId,
        tableName: formField.tableName,
        fieldsCount: fields.length,
        status: formField.status,
      },
      'Employee fields configured successfully',
    ),
  );
});

/* ==============================
   GET EMPLOYEE FIELD CONFIG
============================== */
export const getEmployeeFieldConfiguration = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const formField = await CustomFormField.findOne({
    where: { shopId, tableName: 'Employee' },
  });

  if (!formField) {
    throw new ApiError(404, 'No employee field configuration found for this shop');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fieldId: formField.fieldId,
        shopId: formField.shopId,
        tableName: formField.tableName,
        fields: JSON.parse(formField.fields),
        status: formField.status,
      },
      'Employee field configuration retrieved successfully',
    ),
  );
});

/* ==============================
   ADD EMPLOYEE
============================== */
export const addEmployee = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;
  const data = req.body;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) {
    throw new ApiError(403, 'Unauthorized: You can only add employees to your own shops');
  }

  // Required fields as per CURRENT model
  if (!data.userId) {
    throw new ApiError(400, 'Missing required field: userId');
  }

  const user = await User.findByPk(data.userId);
  if (!user) throw new ApiError(404, 'User not found');

  const employee = await Employee.create({
    shopId,
    userId: data.userId,
    designation: data.designation,
    department: data.department,
    employmentType: data.employmentType || 'FULL_TIME',
    salary: data.salary,
    joiningDate: data.joiningDate,
    probationEndDate: data.probationEndDate,
    reportingTo: data.reportingTo,
    aadhaarNumber: data.aadhaarNumber,
    panNumber: data.panNumber,
    bankAccount: data.bankAccount,
    bankIfsc: data.bankIfsc,
    emergencyContact: data.emergencyContact,
    emergencyContactName: data.emergencyContactName,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      employee,
      'Employee added successfully',
    ),
  );
});

/* ==============================
   GET SHOP EMPLOYEES
============================== */
export const getShopEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const employees = await Employee.findAll({
    where: { shopId, isActive: true },
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(
    new ApiResponse(200, employees, 'Employees retrieved successfully'),
  );
});

/* ==============================
   GET EMPLOYEE BY ID
============================== */
export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = (req as any).params;

  const employee = await Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  return res.status(200).json(
    new ApiResponse(200, employee, 'Employee retrieved successfully'),
  );
});

/* ==============================
   UPDATE EMPLOYEE
============================== */
export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { employeeId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const employee = await Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const shop = await Shop.findByPk(employee.shopId);
  if (!shop || shop.ownerId !== userId) {
    throw new ApiError(403, 'Unauthorized');
  }

  await employee.update(req.body);

  return res.status(200).json(
    new ApiResponse(
      200,
      employee,
      'Employee updated successfully',
    ),
  );
});

/* ==============================
   DELETE (SOFT) EMPLOYEE
============================== */
export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { employeeId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const employee = await Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const shop = await Shop.findByPk(employee.shopId);
  if (!shop || shop.ownerId !== userId) {
    throw new ApiError(403, 'Unauthorized');
  }

  await employee.update({
    isActive: false,
    terminationDate: new Date(),
    terminationReason: req.body.reason || 'Terminated',
  });

  return res.status(200).json(
    new ApiResponse(200, null, 'Employee terminated successfully'),
  );
});
