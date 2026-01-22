import express, { Router, Request, Response } from 'express';
import { Payroll, Employee } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Calculate payroll
router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, employeeId, salaryMonth, basicSalary, hra = 0, medicalAllowance = 0,
    transportAllowance = 0, otherAllowances = 0, pfDeduction = 0, taxDeduction = 0,
    loanDeduction = 0, otherDeductions = 0, workingDays, leaveDays = 0,
    overtimeHours = 0, bonus = 0 } = req.body;

  const shopIdNum = parseInt(shopId as string);
  const employeeIdNum = parseInt(employeeId as string);

  if (!shopId || isNaN(shopIdNum) || !employeeId || isNaN(employeeIdNum) || !salaryMonth || !basicSalary || workingDays === undefined) {
    throw new ApiError('Missing required fields', 400);
  }

  const employee = await Employee.findByPk(employeeIdNum);
  if (!employee) throw new ApiError('Employee not found', 404);

  const allowances = hra + medicalAllowance + transportAllowance + otherAllowances;
  const grossSalary = basicSalary + allowances;
  const deductions = pfDeduction + taxDeduction + loanDeduction + otherDeductions;
  const overtimeAmount = (basicSalary / 26) * (overtimeHours / 8) * 2; // 2x rate
  const totalDeductions = deductions;
  const netSalary = grossSalary - totalDeductions + overtimeAmount + bonus;

  const payroll = await Payroll.create({
    shopId: shopIdNum, employeeId: employeeIdNum, salaryMonth,
    basicSalary, hra, medicalAllowance, transportAllowance, otherAllowances,
    grossSalary, pfDeduction, taxDeduction, loanDeduction, otherDeductions,
    totalDeductions, netSalary, workingDays, leaveDays,
    overtimeHours, overtimeAmount, bonus, paymentStatus: 'pending'
  });

  res.status(201).json({ message: 'Payroll calculated successfully', payroll });
}));

// Get payroll records
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { shopId, employeeId, salaryMonth, paymentStatus } = req.query;
  const filter: any = {};

  if (shopId) {
    const shopIdNum = parseInt(shopId as string);
    if (!isNaN(shopIdNum)) filter.shopId = shopIdNum;
  }
  if (employeeId) {
    const employeeIdNum = parseInt(employeeId as string);
    if (!isNaN(employeeIdNum)) filter.employeeId = employeeIdNum;
  }
  if (salaryMonth) filter.salaryMonth = salaryMonth;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const payrolls = await Payroll.findAll({
    where: filter,
    include: [{ association: 'employee', include: ['user'] }],
    order: [['salaryMonth', 'DESC']]
  });

  res.json(payrolls);
}));

// Get payroll
router.get('/:payrollId', asyncHandler(async (req: Request, res: Response) => {
  const payroll = await Payroll.findByPk(req.params.payrollId, {
    include: [{ association: 'employee', include: ['user'] }]
  });
  if (!payroll) throw new ApiError('Payroll not found', 404);
  res.json(payroll);
}));

// Record payment
router.patch('/:payrollId/pay', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentMode, paymentReference } = req.body;
  const payroll = await Payroll.findByPk(req.params.payrollId);
  if (!payroll) throw new ApiError('Payroll not found', 404);

  await payroll.update({
    paymentStatus: 'paid',
    paymentDate: new Date(),
    paymentMode,
    paymentReference
  });

  res.json({ message: 'Payment recorded', payroll });
}));

export default router;
