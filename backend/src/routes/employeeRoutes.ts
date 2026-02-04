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

// All routes require authentication and SHOP_OWNER role
router.use(authMiddleware);
router.use(roleMiddleware(['SHOP_OWNER']));

// Employee field configuration
router.post('/:shopId/configure-fields', configureEmployeeFields);
router.get('/:shopId/field-configuration', getEmployeeFieldConfiguration);

// Employee management
router.post('/:shopId/add', addEmployee);
router.get('/:shopId/employees', getShopEmployees);
router.get('/details/:employeeId', getEmployeeById);
router.put('/update/:employeeId', updateEmployee);
router.delete('/:employeeId', deleteEmployee);

export default router;
