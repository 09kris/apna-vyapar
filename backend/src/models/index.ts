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
import Product from './Product';
import Category from './Category';
import ShopOrder from './ShopOrder';
import ShopOrderItem from './ShopOrderItem';

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
ShopCustomer.hasMany(LoyaltyPoints, { foreignKey: 'customerId', as: 'loyaltyPoints' });
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

ShopOrder.hasMany(OrderTracking, { foreignKey: 'orderId', as: 'tracking' });
OrderTracking.belongsTo(ShopOrder, { foreignKey: 'orderId', as: 'order' });
User.hasMany(OrderTracking, { foreignKey: 'updatedBy', as: 'orderUpdates' });
OrderTracking.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

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
  ShopOrderItem
};
