import { Request, Response } from 'express';
import { LoyaltyPoints, ShopCustomer, ShopOrder } from '../models';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';

// Get customer loyalty points balance
const getLoyaltyBalance = AsyncHandler(async (req: Request, res: Response) => {
  const { customerId } = req.params as { customerId: string };

  const customer = await ShopCustomer.findByPk(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const currentBalance = customer.loyaltyPoints || 0;

  // Get recent transactions
  const recentTransactions = await LoyaltyPoints.findAll({
    where: { customerId },
    order: [['createdAt', 'DESC']],
    limit: 10
  });

  // Calculate tier based on total purchases
  const totalPurchases = customer.totalPurchases || 0;
  let tier = 'Bronze';
  let tierDiscount = 1;

  if (totalPurchases >= 50000) {
    tier = 'Platinum';
    tierDiscount = 5;
  } else if (totalPurchases >= 20000) {
    tier = 'Gold';
    tierDiscount = 3;
  } else if (totalPurchases >= 5000) {
    tier = 'Silver';
    tierDiscount = 2;
  }

  res.status(200).json(
    new ApiResponse(200, {
      customerId,
      currentBalance,
      tier,
      tierDiscount,
      totalPurchases,
      recentTransactions
    }, 'Loyalty balance fetched successfully')
  );
});

// Add loyalty points (earn)
const addLoyaltyPoints = AsyncHandler(async (req: Request, res: Response) => {
  const { customerId, points, reason, orderId } = req.body;

  const customer = await ShopCustomer.findByPk(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const currentBalance = customer.loyaltyPoints || 0;
  const newBalance = currentBalance + points;

  // Create loyalty points transaction
  const loyaltyTransaction = await LoyaltyPoints.create({
    customerId,
    shopId: customer.shopId,
    transactionType: 'Earn',
    pointsChange: points,
    orderId,
    reason,
    balanceBefore: currentBalance,
    balanceAfter: newBalance,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
  });

  // Update customer balance
  await customer.update({ loyaltyPoints: newBalance });

  res.status(200).json(
    new ApiResponse(200, {
      transaction: loyaltyTransaction,
      newBalance
    }, 'Loyalty points added successfully')
  );
});

// Redeem loyalty points
const redeemLoyaltyPoints = AsyncHandler(async (req: Request, res: Response) => {
  const { customerId, points, reason, orderId } = req.body;

  const customer = await ShopCustomer.findByPk(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const currentBalance = customer.loyaltyPoints || 0;

  if (currentBalance < points) {
    throw new ApiError(400, 'Insufficient loyalty points');
  }

  if (points < 50) {
    throw new ApiError(400, 'Minimum 50 points required for redemption');
  }

  const newBalance = currentBalance - points;

  // Create loyalty points transaction
  const loyaltyTransaction = await LoyaltyPoints.create({
    customerId,
    shopId: customer.shopId,
    transactionType: 'Redeem',
    pointsChange: -points,
    orderId,
    reason,
    balanceBefore: currentBalance,
    balanceAfter: newBalance
  });

  // Update customer balance
  await customer.update({ loyaltyPoints: newBalance });

  // Calculate discount amount (100 points = ₹10)
  const discountAmount = (points / 100) * 10;

  res.status(200).json(
    new ApiResponse(200, {
      transaction: loyaltyTransaction,
      newBalance,
      discountAmount
    }, 'Loyalty points redeemed successfully')
  );
});

// Calculate points for order
const calculateOrderPoints = AsyncHandler(async (req: Request, res: Response) => {
  const { orderAmount, customerId } = req.body;

  // Basic rule: ₹100 spent = 1 point
  const basePoints = Math.floor(orderAmount / 100);

  // Get customer for tier bonus
  const customer = await ShopCustomer.findByPk(customerId);
  let bonusMultiplier = 1;

  if (customer) {
    const totalPurchases = customer.totalPurchases || 0;
    
    if (totalPurchases >= 50000) {
      bonusMultiplier = 1.5; // Platinum: 50% bonus
    } else if (totalPurchases >= 20000) {
      bonusMultiplier = 1.3; // Gold: 30% bonus
    } else if (totalPurchases >= 5000) {
      bonusMultiplier = 1.2; // Silver: 20% bonus
    }
  }

  const totalPoints = Math.floor(basePoints * bonusMultiplier);

  res.status(200).json(
    new ApiResponse(200, {
      orderAmount,
      basePoints,
      bonusMultiplier,
      totalPoints
    }, 'Points calculated successfully')
  );
});

// Get loyalty program statistics
const getLoyaltyStats = AsyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const { startDate, endDate } = req.query;

  const whereClause: any = { shopId };
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [require('sequelize').Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  // Total points issued and redeemed
  const pointsIssued = await LoyaltyPoints.sum('pointsChange', {
    where: { ...whereClause, transactionType: 'Earn' }
  });

  const pointsRedeemed = await LoyaltyPoints.sum('pointsChange', {
    where: { ...whereClause, transactionType: 'Redeem' }
  });

  // Active loyalty customers
  const activeLoyaltyCustomers = await ShopCustomer.count({
    where: {
      shopId,
      loyaltyPoints: {
        [require('sequelize').Op.gt]: 0
      }
    }
  });

  // Top loyalty customers
  const topCustomers = await ShopCustomer.findAll({
    where: { shopId },
    order: [['loyaltyPoints', 'DESC']],
    limit: 10,
    attributes: ['customerId', 'fullName', 'loyaltyPoints', 'totalPurchases']
  });

  res.status(200).json(
    new ApiResponse(200, {
      pointsIssued: pointsIssued || 0,
      pointsRedeemed: Math.abs(pointsRedeemed || 0),
      activeLoyaltyCustomers,
      topCustomers
    }, 'Loyalty statistics fetched successfully')
  );
});

export {
  getLoyaltyBalance,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  calculateOrderPoints,
  getLoyaltyStats
};