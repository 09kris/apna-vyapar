import { Router } from 'express';
import {
  configurePayrollFields,
  getPayrollFieldConfiguration,
  generatePayroll,
} from '../controller/PayrollController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes
router.post('/shops/:shopId/payroll/configure-fields', authMiddleware, configurePayrollFields);
router.get('/shops/:shopId/payroll/field-config', authMiddleware, getPayrollFieldConfiguration);
router.post('/shops/:shopId/payroll/generate', authMiddleware, generatePayroll);

export default router;
