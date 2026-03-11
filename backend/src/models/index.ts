import User from './User';
import ShopOwner from './ShopOwner';
import Shop from './Shop';
import Employee from './Employee';
import CustomFormField from './CustomFormField';
import ReferralLog from './ReferralLog';
import LoyaltyPoints from './LoyaltyPoints';
import Notification from './Notification';
import Coupon from './Coupon';
import CatalogAccess from './CatalogAccess';
import ReferralCode from './ReferralCode';
import PublicCatalog from './PublicCatalog';
import OrderTracking from './OrderTracking';
import ShopCustomer from './ShopCustomer';
import Product from './Product';
import Category from './Category';
import ShopOrder from './ShopOrder';
import ShopOrderItem from './ShopOrderItem';
import Payment from './Payment';
import Enquiry from './Enquiry';
import Conversation from './Conversation';
import ChatMessage from './ChatMessage';
import Payroll from './Payroll';
import Accounting from './Accounting';
import Cart from './Cart';
import OrderStatusHistory from './OrderStatusHistory';

// Define associations
User.hasOne(ShopOwner, { foreignKey: 'userId', as: 'shopOwner' });
ShopOwner.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ShopOwner.hasMany(Shop, { foreignKey: 'ownerId', as: 'shops' });
Shop.belongsTo(ShopOwner, { foreignKey: 'ownerId', as: 'owner' });

Shop.hasMany(Employee, { foreignKey: 'shopId', as: 'employees' });
Employee.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Shop.hasMany(CustomFormField, { foreignKey: 'shopId', as: 'customForms' });
CustomFormField.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// New model associations
Shop.hasMany(ReferralCode, { foreignKey: 'shopId', as: 'referralCodes' });
ReferralCode.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
User.hasMany(ReferralCode, { foreignKey: 'createdBy', as: 'createdReferrals' });
ReferralCode.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Shop.hasMany(PublicCatalog, { foreignKey: 'shopId', as: 'publicCatalog' });
PublicCatalog.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
User.hasMany(PublicCatalog, { foreignKey: 'createdBy', as: 'createdPublicCatalogs' });
PublicCatalog.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Shop.hasMany(ReferralLog, { foreignKey: 'shopId', as: 'referralLogs' });
ReferralLog.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

Shop.hasMany(LoyaltyPoints, { foreignKey: 'shopId', as: 'loyaltyPoints' });
LoyaltyPoints.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
ShopCustomer.hasMany(LoyaltyPoints, { foreignKey: 'customerId', as: 'loyaltyTransactions' });
LoyaltyPoints.belongsTo(ShopCustomer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Shop.hasMany(Notification, { foreignKey: 'shopId', as: 'notifications' });
Notification.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

Shop.hasMany(Coupon, { foreignKey: 'shopId', as: 'coupons' });
Coupon.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
User.hasMany(Coupon, { foreignKey: 'createdBy', as: 'createdCoupons' });
Coupon.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Shop.hasMany(CatalogAccess, { foreignKey: 'shopId', as: 'catalogAccess' });
CatalogAccess.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// Order associations
ShopOrder.belongsTo(ShopCustomer, { foreignKey: 'customerId', as: 'customer' });
ShopCustomer.hasMany(ShopOrder, { foreignKey: 'customerId', as: 'orders' });

ShopOrder.hasMany(ShopOrderItem, { foreignKey: 'orderId', as: 'items' });
ShopOrderItem.belongsTo(ShopOrder, { foreignKey: 'orderId', as: 'order' });

// Product and OrderItem associations
Product.hasMany(ShopOrderItem, { foreignKey: 'productId', as: 'orderItems' });
ShopOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

ShopOrder.hasMany(OrderTracking, { foreignKey: 'orderId', as: 'tracking' });
OrderTracking.belongsTo(ShopOrder, { foreignKey: 'orderId', as: 'order' });
User.hasMany(OrderTracking, { foreignKey: 'updatedBy', as: 'orderUpdates' });
OrderTracking.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// Payment associations
Shop.hasMany(Payment, { foreignKey: 'shopId', as: 'payments' });
Payment.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
ShopOrder.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(ShopOrder, { foreignKey: 'orderId', as: 'order' });

// Payroll associations
Shop.hasMany(Payroll, { foreignKey: 'shopId', as: 'payrolls' });
Payroll.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Accounting associations
Shop.hasMany(Accounting, { foreignKey: 'shopId', as: 'accountingRecords' });
Accounting.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// Cart associations
User.hasMany(Cart, { foreignKey: 'userId', as: 'cartItems' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Shop.hasMany(Cart, { foreignKey: 'shopId', as: 'cartItems' });
Cart.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Product.hasMany(Cart, { foreignKey: 'productId', as: 'cartItems' });
Cart.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export {
  User, 
  ShopOwner, 
  Shop, 
  Employee, 
  CustomFormField,
  ReferralCode,
  PublicCatalog,
  ReferralLog,
  LoyaltyPoints,
  Notification,
  Coupon,
  CatalogAccess,
  OrderTracking,
  ShopCustomer,
  Product,
  Category,
  ShopOrder,
  ShopOrderItem,
  Payment,
  Enquiry,
  Conversation,
  ChatMessage,
  Payroll,
  Accounting,
  Cart,
  OrderStatusHistory
};
