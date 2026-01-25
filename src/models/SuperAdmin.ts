import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';

export interface ISuperAdmin {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: string; // 'platform_admin', 'finance_admin', 'support_admin'
  permissions: string; // JSON array
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class SuperAdmin extends Model<ISuperAdmin> implements ISuperAdmin {
  declare id: number;
  declare fullName: string;
  declare email: string;
  declare phone?: string;
  declare passwordHash: string;
  declare role: string;
  declare permissions: string;
  declare isActive: boolean;
  declare lastLogin?: Date;
  declare loginAttempts: number;
  declare lockedUntil?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}

SuperAdmin.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fullName: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(20) },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { 
    type: DataTypes.ENUM('platform_admin', 'finance_admin', 'support_admin', 'super_admin'),
    defaultValue: 'support_admin'
  },
  permissions: { type: DataTypes.JSON, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastLogin: { type: DataTypes.DATE },
  loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockedUntil: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  tableName: 'super_admins',
  timestamps: true,
  hooks: {
    beforeCreate: async (admin: any) => {
      if (admin.passwordHash) {
        admin.passwordHash = await bcrypt.hash(admin.passwordHash, 10);
      }
    },
    beforeUpdate: async (admin: any) => {
      if (admin.changed('passwordHash')) {
        admin.passwordHash = await bcrypt.hash(admin.passwordHash, 10);
      }
    }
  },
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});

export default SuperAdmin;
