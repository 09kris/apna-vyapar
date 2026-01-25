import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface IAbuseReport {
  id: number;
  shopId: number;
  reportedBy?: number; // User ID or null for anonymous
  reportType: string; // 'fraud', 'quality_issue', 'fake_products', 'unsafe_transaction', 'harassment', 'other'
  severity: string; // 'low', 'medium', 'high', 'critical'
  description: string;
  evidence?: string; // File URLs (JSON array)
  status: string; // 'open', 'investigating', 'resolved', 'dismissed'
  actionTaken?: string; // 'warning', 'suspension', 'permanent_ban', 'none'
  investigatedBy?: number; // SuperAdmin ID
  investigationNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AbuseReport extends Model<IAbuseReport> implements IAbuseReport {
  declare id: number;
  declare shopId: number;
  declare reportedBy?: number;
  declare reportType: string;
  declare severity: string;
  declare description: string;
  declare evidence?: string;
  declare status: string;
  declare actionTaken?: string;
  declare investigatedBy?: number;
  declare investigationNotes?: string;
  declare resolvedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare shop?: any;
  declare reporter?: any;
  declare investigator?: any;
}

AbuseReport.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  shopId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'Shops', key: 'id' }
  },
  reportedBy: { 
    type: DataTypes.INTEGER,
    references: { model: 'Users', key: 'id' }
  },
  reportType: { 
    type: DataTypes.ENUM('fraud', 'quality_issue', 'fake_products', 'unsafe_transaction', 'harassment', 'other'),
    allowNull: false
  },
  severity: { 
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), 
    defaultValue: 'medium'
  },
  description: { type: DataTypes.TEXT, allowNull: false },
  evidence: { type: DataTypes.JSON, defaultValue: [] },
  status: { type: DataTypes.ENUM('open', 'investigating', 'resolved', 'dismissed'), defaultValue: 'open' },
  actionTaken: { type: DataTypes.ENUM('warning', 'suspension', 'permanent_ban', 'none') },
  investigatedBy: { 
    type: DataTypes.INTEGER,
    references: { model: 'super_admins', key: 'id' }
  },
  investigationNotes: { type: DataTypes.TEXT },
  resolvedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  tableName: 'abuse_reports',
  timestamps: true,
  indexes: [
    { fields: ['shopId'] },
    { fields: ['status'] },
    { fields: ['severity'] },
    { fields: ['createdAt'] }
  ]
});

export default AbuseReport;
