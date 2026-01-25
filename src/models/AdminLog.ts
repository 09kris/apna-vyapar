import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface IAdminLog {
  id: number;
  adminId: number;
  action: string; // 'shop_approved', 'shop_blocked', 'kyc_verified', 'abuse_resolved', 'subscription_changed'
  entityType: string; // 'shop', 'subscription', 'kyc', 'abuse_report'
  entityId: number;
  changes: string; // JSON - what changed
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminLog extends Model<IAdminLog> implements IAdminLog {
  declare id: number;
  declare adminId: number;
  declare action: string;
  declare entityType: string;
  declare entityId: number;
  declare changes: string;
  declare ipAddress?: string;
  declare userAgent?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare admin?: any;
}

AdminLog.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  adminId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'super_admins', key: 'id' }
  },
  action: { 
    type: DataTypes.ENUM(
      'shop_approved', 
      'shop_blocked', 
      'shop_unblocked',
      'kyc_verified', 
      'kyc_rejected',
      'abuse_resolved', 
      'subscription_changed',
      'subscription_suspended',
      'payment_recorded',
      'user_suspended',
      'features_updated'
    ),
    allowNull: false
  },
  entityType: { 
    type: DataTypes.ENUM('shop', 'subscription', 'kyc', 'abuse_report', 'user'),
    allowNull: false
  },
  entityId: { type: DataTypes.INTEGER, allowNull: false },
  changes: { type: DataTypes.JSON, defaultValue: {} },
  ipAddress: { type: DataTypes.STRING(45) },
  userAgent: { type: DataTypes.STRING(500) },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  tableName: 'admin_logs',
  timestamps: true,
  indexes: [
    { fields: ['adminId'] },
    { fields: ['action'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['createdAt'] }
  ]
});

export default AdminLog;


