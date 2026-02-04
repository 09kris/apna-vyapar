import { Request, Response } from 'express';
import Customer from '../models/ShopCustomer';
import Shop from '../models/Shop';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* ==============================
   ADD CUSTOMER
============================== */
export const addCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  const { fullName, phone, customerType, referralCodeUsed } = req.body;

  if (!fullName || !phone || !customerType || !referralCodeUsed) {
    throw new ApiError(400, 'Missing required customer fields');
  }

  const customer = await Customer.create({
    shopId,
    ...req.body,
  });

  return res.status(201).json(
    new ApiResponse(201, customer, 'Customer added successfully'),
  );
});

/* ==============================
   GET SHOP CUSTOMERS
============================== */
export const getShopCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = (req as any).params;

  const customers = await Customer.findAll({
    where: { shopId, isActive: true },
    order: [['createdAt', 'DESC']],
  });

  return res.status(200).json(
    new ApiResponse(200, customers, 'Customers retrieved successfully'),
  );
});

/* ==============================
   GET CUSTOMER BY ID
============================== */
export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const { customerId } = (req as any).params;

  const customer = await Customer.findByPk(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  return res.status(200).json(
    new ApiResponse(200, customer, 'Customer retrieved successfully'),
  );
});

/* ==============================
   UPDATE CUSTOMER
============================== */
export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { customerId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const customer = await Customer.findByPk(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const shop = await Shop.findByPk(customer.shopId);
  if (!shop || shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  await customer.update(req.body);

  return res.status(200).json(
    new ApiResponse(200, customer, 'Customer updated successfully'),
  );
});

/* ==============================
   DELETE CUSTOMER (SOFT)
============================== */
export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { customerId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const customer = await Customer.findByPk(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const shop = await Shop.findByPk(customer.shopId);
  if (!shop || shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  await customer.update({ isActive: false });

  return res.status(200).json(
    new ApiResponse(200, null, 'Customer deleted successfully'),
  );
});

/* ==============================
   BLACKLIST CUSTOMER
============================== */
export const blacklistCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { customerId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  const customer = await Customer.findByPk(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const shop = await Shop.findByPk(customer.shopId);
  if (!shop || shop.ownerId !== userId) throw new ApiError(403, 'Unauthorized');

  await customer.update({ isBlacklisted: true });

  return res.status(200).json(
    new ApiResponse(200, null, 'Customer blacklisted successfully'),
  );
});
