import { Router } from 'express';
import {
  configureEmployeeFields,
  getEmployeeFieldConfiguration,
  addEmployee,
  getShopEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from '../controller/EmployeeController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee field configuration - only SHOP_OWNER can configure
router.post('/:shopId/configure-fields', roleMiddleware(['SHOP_OWNER']), configureEmployeeFields);
router.get('/:shopId/field-configuration', roleMiddleware(['SHOP_OWNER']), getEmployeeFieldConfiguration);

// Employee management
// View employees - both SHOP_OWNER and EMPLOYEE can view
router.get('/:shopId/employees', roleMiddleware(['SHOP_OWNER', 'EMPLOYEE']), getShopEmployees);
router.get('/details/:employeeId', roleMiddleware(['SHOP_OWNER', 'EMPLOYEE']), getEmployeeById);

// Add, update, delete - only SHOP_OWNER can manage
router.post('/:shopId/add', roleMiddleware(['SHOP_OWNER']), addEmployee);
router.put('/update/:employeeId', roleMiddleware(['SHOP_OWNER']), updateEmployee);
router.delete('/:employeeId', roleMiddleware(['SHOP_OWNER']), deleteEmployee);

export default router;
