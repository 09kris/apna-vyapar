import { Router } from 'express';
import {
  configurePayrollFields,
  getPayrollFieldConfiguration,
  generatePayroll,
  getPayrollsByShop,
  getPayrollById,
  updatePayrollPaymentStatus,
  deletePayroll,
} from '../controller/PayrollController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected routes - Only SHOP_OWNER can access payroll
router.post('/shops/:shopId/payroll/configure-fields', authMiddleware, roleMiddleware(['SHOP_OWNER']), configurePayrollFields);
router.get('/shops/:shopId/payroll/field-config', authMiddleware, roleMiddleware(['SHOP_OWNER']), getPayrollFieldConfiguration);
router.post('/shops/:shopId/payroll/generate', authMiddleware, roleMiddleware(['SHOP_OWNER']), generatePayroll);
router.get('/shops/:shopId/payrolls', authMiddleware, roleMiddleware(['SHOP_OWNER']), getPayrollsByShop);
router.get('/payrolls/:payrollId', authMiddleware, roleMiddleware(['SHOP_OWNER']), getPayrollById);
router.patch('/payrolls/:payrollId/payment-status', authMiddleware, roleMiddleware(['SHOP_OWNER']), updatePayrollPaymentStatus);
router.delete('/payrolls/:payrollId', authMiddleware, roleMiddleware(['SHOP_OWNER']), deletePayroll);

export default router;
