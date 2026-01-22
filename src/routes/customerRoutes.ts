import express, { Router, Request, Response } from 'express';
import { Customer } from '../models';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Register customer via referral
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { referralCode, fullName, email, phone, customerType = 'retail', address, city, state, pincode, shopId } = req.body;

  if (!referralCode || !fullName || !phone || !shopId) {
    throw new ApiError('Missing required fields', 400);
  }

  const shopIdNum = parseInt(shopId as string);
  if (isNaN(shopIdNum)) {
    throw new ApiError('Invalid shop ID', 400);
  }

  const customer = await Customer.create({
    shopId: shopIdNum,
    fullName, email, phone, customerType,
    referralCodeUsed: referralCode, address, city, state, pincode,
    totalPurchases: 0, loyaltyPoints: 0,
    creditLimit: customerType === 'wholesale' ? 50000 : 0,
    outstandingBalance: 0, isActive: true, isBlacklisted: false
  });

  res.status(201).json({ message: 'Customer registered successfully', customer });
}));

// Get customers
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { shopId, customerType, isActive = true } = req.query;
  const filter: any = {};

  if (shopId) {
    const shopIdNum = parseInt(shopId as string);
    if (!isNaN(shopIdNum)) filter.shopId = shopIdNum;
  }
  if (customerType) filter.customerType = customerType;
  if (isActive !== 'all') filter.isActive = isActive === 'true';

  const customers = await Customer.findAll({ where: filter, order: [['createdAt', 'DESC']] });
  res.json(customers);
}));

// Get customer
router.get('/:customerId', asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findByPk(req.params.customerId);
  if (!customer) throw new ApiError('Customer not found', 404);
  res.json(customer);
}));

// Update customer
router.put('/:customerId', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await Customer.findByPk(req.params.customerId);
  if (!customer) throw new ApiError('Customer not found', 404);

  await customer.update(req.body);
  res.json({ message: 'Customer updated', customer });
}));

// Add loyalty points
router.post('/:customerId/points', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { points } = req.body;
  const customer = await Customer.findByPk(req.params.customerId);
  if (!customer) throw new ApiError('Customer not found', 404);

  await customer.update({
    loyaltyPoints: (customer.loyaltyPoints || 0) + points
  });

  res.json({ message: 'Loyalty points updated', customer });
}));

// Set credit limit
router.post('/:customerId/credit-limit', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { creditLimit } = req.body;
  const customer = await Customer.findByPk(req.params.customerId);
  if (!customer) throw new ApiError('Customer not found', 404);

  await customer.update({ creditLimit });
  res.json({ message: 'Credit limit updated', customer });
}));

export default router;
