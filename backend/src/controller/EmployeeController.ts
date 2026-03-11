import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import CustomFormField from '../models/CustomFormField';
import Employee from '../models/Employee';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* ==============================
   HELPER: Check if user owns the shop
============================== */
const isShopOwner = async (shopId: string, userId: string): Promise<boolean> => {
  // First, find the shop to get its ownerId
  const shop = await Shop.findByPk(shopId);
  if (!shop) return false;
  
  // Find the shop owner by userId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  if (!shopOwner) return false;
  
  // Compare shopOwner.ownerId with shop.ownerId
  return shop.ownerId === shopOwner.ownerId;
};

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
  
  // Use helper function to check ownership
  const userOwnsShop = await isShopOwner(shopId, userId);
  if (!userOwnsShop) {
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
   HELPER: Convert frontend enum values to backend format
============================== */
const convertEmploymentType = (value: string): 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' => {
  const mapping: Record<string, 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'> = {
    'Full-time': 'FULL_TIME',
    'Part-time': 'PART_TIME',
    'Contract': 'CONTRACT',
    'FULL_TIME': 'FULL_TIME',
    'PART_TIME': 'PART_TIME',
    'CONTRACT': 'CONTRACT',
    'INTERN': 'INTERN',
  };
  return mapping[value] || 'FULL_TIME';
};

const convertEmployeeType = (value: string): 'WORKER' | 'MANAGER' => {
  const mapping: Record<string, 'WORKER' | 'MANAGER'> = {
    'Worker': 'WORKER',
    'Manager': 'MANAGER',
    'WORKER': 'WORKER',
    'MANAGER': 'MANAGER',
  };
  return mapping[value] || 'WORKER';
};

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
  
  // Use helper function to check ownership
  const userOwnsShop = await isShopOwner(shopId, userId);
  if (!userOwnsShop) {
    throw new ApiError(403, 'Unauthorized: You can only add employees to your own shops');
  }

  // Required fields: firstName, lastName, email, phone, password
  if (!data.firstName) {
    throw new ApiError(400, 'Missing required field: firstName');
  }
  if (!data.lastName) {
    throw new ApiError(400, 'Missing required field: lastName');
  }
  if (!data.email) {
    throw new ApiError(400, 'Missing required field: email');
  }
  if (!data.phone) {
    throw new ApiError(400, 'Missing required field: phone');
  }
  if (!data.password) {
    throw new ApiError(400, 'Missing required field: password');
  }

  // Check if user with the given email already exists
  let existingUser = await User.findOne({ where: { email: data.email } });
  
  let employeeUserId: string;
  
  if (existingUser) {
    // Use existing user
    employeeUserId = existingUser.userId;
  } else {
    // Hash password
    console.log('🔐 Hashing password for new employee:', data.email);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    console.log('🔐 Password hashed successfully');
    
    // Create a new user for the employee
    const newUser = await User.create({
      email: data.email,
      phoneNumber: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash,
      userType: 'EMPLOYEE',
      isActive: true,
      emailVerified: false,
    });
    employeeUserId = newUser.userId;
    console.log('✅ New employee user created with userId:', employeeUserId);
  }

  // Convert frontend enum values to backend format
  const employmentType = convertEmploymentType(data.employmentType || 'Full-time');
  const employeeType = convertEmployeeType(data.employeeType || 'Worker');

  const employee = await Employee.create({
    shopId,
    userId: employeeUserId,
    employeeCode: data.employeeCode || null,
    designation: data.designation,
    department: data.department,
    employmentType: employmentType,
    employeeType: employeeType,
    staffRole: 'Staff', // Default staff role
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
    // Store user details directly on employee as well
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
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
   GET SHOP EMPLOYEES (with pagination)
============================== */
export const getShopEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;
  const { page = 1, limit = 10, includeInactive = 'false' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  // Build where clause
  const whereClause: any = { shopId };
  
  // Only show active employees by default, unless includeInactive is true
  if (includeInactive !== 'true') {
    whereClause.isActive = true;
  }

  const { count, rows: employees } = await Employee.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['userId', 'firstName', 'lastName', 'email', 'phoneNumber', 'profileImage', 'isActive']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset: offset,
  });

  const totalPages = Math.ceil(count / limitNum);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: employees,
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages
      },
      'Employees retrieved successfully',
    ),
  );
});

/* ==============================
   GET EMPLOYEE BY ID (with User association)
============================== */
export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = (req as any).params;

  const employee = await Employee.findByPk(employeeId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['userId', 'firstName', 'lastName', 'email', 'phoneNumber', 'profileImage', 'isActive']
      }
    ]
  });
  
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

  // Use helper function to check ownership
  const userOwnsShop = await isShopOwner(employee.shopId, userId);
  if (!userOwnsShop) {
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

  // Use helper function to check ownership
  const userOwnsShop = await isShopOwner(employee.shopId, userId);
  if (!userOwnsShop) {
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
