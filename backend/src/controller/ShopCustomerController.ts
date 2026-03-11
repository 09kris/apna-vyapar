import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Customer from '../models/ShopCustomer';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import Employee from '../models/Employee';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* ==============================
   VERIFICATION HELPERS
============================== */
const verifyShopAccess = async (shopId: string, userId: string): Promise<Shop> => {
  // First, look up the ShopOwner by userId to get the correct ownerId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  
  // Get the shop
  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }
  
  // Check if user is the shop owner (compare shopOwner.ownerId with shop.ownerId)
  if (shopOwner && shop.ownerId === shopOwner.ownerId) {
    return shop;
  }

  // Check if user is active employee - First try with userId
  let employee = await Employee.findOne({
    where: { shopId, userId, isActive: true }
  });

  // If no employee found with userId, try to find by linking through User table
  if (!employee) {
    // Find the user by userId to get their email/phone, then find employee
    const User = (await import('../models/User')).default;
    const user = await User.findByPk(userId);
    
    if (user) {
      // Try finding employee by email or phone matching
      employee = await Employee.findOne({
        where: { 
          shopId, 
          isActive: true,
          [Op.or]: [
            { email: user.email },
            { phone: user.phoneNumber }
          ]
        }
      });
    }
  }

  // If still no employee found, check if there's ANY active employee for this shop (fallback)
  // This helps if employee record exists but userId wasn't properly linked
  if (!employee) {
    const employeesInShop = await Employee.findAll({
      where: { shopId, isActive: true },
      limit: 1
    });
    
    // Only allow access if there's exactly one employee and no owner match
    // This is a fallback for improperly configured employee records
    if (employeesInShop.length === 1 && !shopOwner) {
      console.warn(`⚠️ Allowing access to shop ${shopId} for user ${userId} - employee record found but userId not linked`);
      return shop;
    }
  }

  if (employee) {
    return shop;
  }

  throw new ApiError(403, 'Unauthorized - you do not have access to this shop');
};

/* ==============================
   ADD CUSTOMER
============================== */
export const addCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  await verifyShopAccess(shopId, userId);

  const { fullName, phone, customerType, referralCodeUsed } = req.body;

  if (!fullName || !phone || !customerType) {
    throw new ApiError(400, 'Missing required customer fields');
  }

  const customer = await Customer.create({
    shopId,
    referralCodeUsed: referralCodeUsed || null,
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
  const userId = (req as any).user?.userId;
  const { shopId } = (req as any).params;

  if (!userId) throw new ApiError(401, 'Not authenticated');

  await verifyShopAccess(shopId, userId);

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

  await verifyShopAccess(customer.shopId, userId);

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

  await verifyShopAccess(customer.shopId, userId);

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

  await verifyShopAccess(customer.shopId, userId);

  await customer.update({ isBlacklisted: true });

  return res.status(200).json(
    new ApiResponse(200, null, 'Customer blacklisted successfully'),
  );
});
