import express, { Router, Request, Response } from 'express';
import { Employee, User } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Create employee
router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, fullName, email, phone, designation, department, employmentType = 'full-time',
    salary, joiningDate, panNumber, bankAccount, bankIfsc } = req.body;

  const shopIdNum = parseInt(shopId as string);
  if (!shopId || isNaN(shopIdNum) || !fullName || !email || !phone || !salary) {
    throw new ApiError('Missing required fields', 400);
  }

  const employeeCode = `EMP-${Date.now()}`;
  const employee = await Employee.create({
    shopId: shopIdNum, employeeCode, fullName, email, phone, designation, department,
    employmentType, salary, joiningDate: new Date(joiningDate),
    panNumber, bankAccount, bankIfsc, isActive: true
  });

  res.status(201).json({ message: 'Employee created successfully', employee });
}));

// Get employees
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { shopId, designation, isActive = true } = req.query;
  const filter: any = {};

  if (shopId) {
    const shopIdNum = parseInt(shopId as string);
    if (!isNaN(shopIdNum)) filter.shopId = shopIdNum;
  }
  if (designation) filter.designation = designation;
  if (isActive !== 'all') filter.isActive = isActive === 'true';

  const employees = await Employee.findAll({
    where: filter,
    include: ['user', 'manager'],
    order: [['createdAt', 'DESC']]
  });

  res.json(employees);
}));

// Get employee
router.get('/:employeeId', asyncHandler(async (req: Request, res: Response) => {
  const employee = await Employee.findByPk(req.params.employeeId, {
    include: ['user', 'manager']
  });
  if (!employee) throw new ApiError('Employee not found', 404);
  res.json(employee);
}));

// Update employee
router.put('/:employeeId', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const employee = await Employee.findByPk(req.params.employeeId);
  if (!employee) throw new ApiError('Employee not found', 404);

  await employee.update(req.body);
  res.json({ message: 'Employee updated', employee });
}));

// Terminate employee
router.post('/:employeeId/terminate', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { terminationReason } = req.body;
  const employee = await Employee.findByPk(req.params.employeeId);
  if (!employee) throw new ApiError('Employee not found', 404);

  await employee.update({
    isActive: false,
    terminationDate: new Date(),
    terminationReason
  });

  res.json({ message: 'Employee terminated', employee });
}));

export default router;
