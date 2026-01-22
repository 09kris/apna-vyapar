// Model exports
export { User } from './User';
export { Shop } from './Shop';
export { Product } from './Product';
export { Category } from './Category';
export { Order } from './Order';
export { Customer } from './Customer';
export { Employee } from './Employee';
export { Payroll } from './Payroll';
export { Location } from './Location';
export { InventoryTransaction } from './InventoryTransaction';
export { Notification } from './Notification';
export { ReferralLog } from './ReferralLog';
export { Plan } from './Plan';
export { Subscription } from './Subscription';
export { PaymentRecord } from './PaymentRecord';
export { SuperAdmin } from './SuperAdmin';
export { KYCVerification } from './KYCVerification';
export { AbuseReport } from './AbuseReport';
export { AdminLog } from './AdminLog';

// Import all models
import User from './User';
import Shop from './Shop';
import Product from './Product';
import Category from './Category';
import Order from './Order';
import Customer from './Customer';
import Employee from './Employee';
import Payroll from './Payroll';
import Location from './Location';
import InventoryTransaction from './InventoryTransaction';
import Notification from './Notification';
import ReferralLog from './ReferralLog';
import Plan from './Plan';
import Subscription from './Subscription';
import PaymentRecord from './PaymentRecord';
import SuperAdmin from './SuperAdmin';
import KYCVerification from './KYCVerification';
import AbuseReport from './AbuseReport';
import AdminLog from './AdminLog';

// Setup associations (relationships)
export const setupAssociations = () => {
  // User associations
  User.hasMany(Shop, { foreignKey: 'ownerId', as: 'shops' });
  Shop.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

  User.hasMany(Employee, { foreignKey: 'userId', as: 'employees' });
  Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(InventoryTransaction, { foreignKey: 'performedBy', as: 'transactions' });
  InventoryTransaction.belongsTo(User, { foreignKey: 'performedBy', as: 'performedByUser' });

  // Shop associations
  Shop.hasMany(Product, { foreignKey: 'shopId', as: 'products' });
  Product.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  Shop.hasMany(Category, { foreignKey: 'shopId', as: 'categories' });
  Category.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  Shop.hasMany(Order, { foreignKey: 'shopId', as: 'orders' });
  Order.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  Shop.hasMany(Customer, { foreignKey: 'shopId', as: 'customers' });
  Customer.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  Shop.hasMany(Employee, { foreignKey: 'shopId', as: 'employees' });
  Employee.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  Shop.hasMany(Payroll, { foreignKey: 'shopId', as: 'payrolls' });
  Payroll.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  Shop.hasMany(Location, { foreignKey: 'shopId', as: 'locations' });
  Location.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  Shop.hasMany(InventoryTransaction, { foreignKey: 'shopId', as: 'transactions' });
  InventoryTransaction.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  Shop.hasMany(ReferralLog, { foreignKey: 'shopId', as: 'referralLogs' });
  ReferralLog.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

  // Category associations
  Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
  Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

  Category.belongsToMany(Category, {
    as: 'parentCategory',
    through: 'CategoryHierarchy',
    foreignKey: 'childCategoryId',
    otherKey: 'parentCategoryId',
  });

  // Product associations
  Product.hasMany(InventoryTransaction, { foreignKey: 'productId', as: 'transactions' });
  InventoryTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

  // Order associations
  Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });

  // Employee associations
  Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
  Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

  Employee.belongsTo(Employee, { foreignKey: 'reportingTo', as: 'manager' });
  Employee.hasMany(Employee, { foreignKey: 'reportingTo', as: 'subordinates' });

  // Customer associations
  Customer.hasMany(ReferralLog, { foreignKey: 'customerId', as: 'referralLogs' });
  ReferralLog.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

  // Plan associations
  Plan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
  Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

  Plan.hasMany(PaymentRecord, { foreignKey: 'planId', as: 'payments' });
  PaymentRecord.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

  // Subscription associations
  Subscription.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
  Shop.hasOne(Subscription, { foreignKey: 'shopId', as: 'subscription' });

  Subscription.hasMany(PaymentRecord, { foreignKey: 'subscriptionId', as: 'payments' });
  PaymentRecord.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

  // Payment associations
  PaymentRecord.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
  Shop.hasMany(PaymentRecord, { foreignKey: 'shopId', as: 'payments' });

  // KYC Verification associations
  KYCVerification.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
  Shop.hasOne(KYCVerification, { foreignKey: 'shopId', as: 'kyc' });

  KYCVerification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(KYCVerification, { foreignKey: 'userId', as: 'kycVerifications' });

  KYCVerification.belongsTo(SuperAdmin, { foreignKey: 'verifiedBy', as: 'verifier' });
  SuperAdmin.hasMany(KYCVerification, { foreignKey: 'verifiedBy', as: 'verifiedKYCs' });

  // Abuse Report associations
  AbuseReport.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
  Shop.hasMany(AbuseReport, { foreignKey: 'shopId', as: 'abuseReports' });

  AbuseReport.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });
  User.hasMany(AbuseReport, { foreignKey: 'reportedBy', as: 'reportedAbuses' });

  AbuseReport.belongsTo(SuperAdmin, { foreignKey: 'investigatedBy', as: 'investigator' });
  SuperAdmin.hasMany(AbuseReport, { foreignKey: 'investigatedBy', as: 'investigatedCases' });

  // Admin Log associations
  AdminLog.belongsTo(SuperAdmin, { foreignKey: 'adminId', as: 'admin' });
  SuperAdmin.hasMany(AdminLog, { foreignKey: 'adminId', as: 'logs' });
};

// Export all models as default
export default {
  User,
  Shop,
  Product,
  Category,
  Order,
  Customer,
  Employee,
  Payroll,
  Location,
  InventoryTransaction,
  Notification,
  ReferralLog,
  Plan,
  Subscription,
  PaymentRecord,
  SuperAdmin,
  KYCVerification,
  AbuseReport,
  AdminLog,
};
