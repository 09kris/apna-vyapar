import { Shop } from '../models';

// Generate unique referral code
export const generateUniqueReferralCode = async (): Promise<string> => {
  let referralCode: string;
  let isUnique = false;
  
  while (!isUnique) {
    referralCode = `SHOP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const existingShop = await Shop.findOne({ where: { referralCode } });
    if (!existingShop) {
      isUnique = true;
    }
  }
  
  return referralCode!;
};

// Calculate loyalty points based on order amount
export const calculateLoyaltyPoints = (orderAmount: number, tierMultiplier: number = 1): number => {
  // Basic rule: ₹100 spent = 1 point
  const basePoints = Math.floor(orderAmount / 100);
  return Math.floor(basePoints * tierMultiplier);
};

// Get customer tier based on total purchases
export const getCustomerTier = (totalPurchases: number): { tier: string; discount: number; multiplier: number } => {
  if (totalPurchases >= 50000) {
    return { tier: 'Platinum', discount: 5, multiplier: 1.5 };
  } else if (totalPurchases >= 20000) {
    return { tier: 'Gold', discount: 3, multiplier: 1.3 };
  } else if (totalPurchases >= 5000) {
    return { tier: 'Silver', discount: 2, multiplier: 1.2 };
  } else {
    return { tier: 'Bronze', discount: 1, multiplier: 1 };
  }
};

// Calculate discount amount from coupon
export const calculateCouponDiscount = (
  orderAmount: number,
  discountType: 'Percentage' | 'Fixed',
  discountValue: number,
  maxDiscount?: number
): number => {
  let discountAmount = 0;
  
  if (discountType === 'Percentage') {
    discountAmount = (orderAmount * discountValue) / 100;
    
    // Apply max discount limit
    if (maxDiscount && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }
  } else {
    discountAmount = discountValue;
  }

  // Ensure discount doesn't exceed order amount
  if (discountAmount > orderAmount) {
    discountAmount = orderAmount;
  }

  return discountAmount;
};

// Format currency for Indian Rupees
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Generate order number
export const generateOrderNumber = (shopId: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const shopCode = shopId.slice(-4).toUpperCase();
  return `ORD-${shopCode}-${timestamp}`;
};

// Generate invoice number
export const generateInvoiceNumber = (shopId: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shopCode = shopId.slice(-4).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `INV-${shopCode}-${year}${month}-${timestamp}`;
};

// Validate GST number format
export const validateGSTNumber = (gstNumber: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
};

// Get device type from user agent
export const getDeviceType = (userAgent: string): 'Mobile' | 'Desktop' | 'Tablet' => {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;
  
  if (tabletRegex.test(userAgent)) {
    return 'Tablet';
  } else if (mobileRegex.test(userAgent)) {
    return 'Mobile';
  } else {
    return 'Desktop';
  }
};

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Generate random coupon code
export const generateCouponCode = (prefix: string = '', length: number = 8): string => {
  const randomPart = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  return prefix ? `${prefix}${randomPart}` : randomPart;
};

export default {
  generateUniqueReferralCode,
  calculateLoyaltyPoints,
  getCustomerTier,
  calculateCouponDiscount,
  formatCurrency,
  generateOrderNumber,
  generateInvoiceNumber,
  validateGSTNumber,
  getDeviceType,
  calculatePercentageChange,
  generateCouponCode
};