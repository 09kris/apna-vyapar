import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface IKYCVerification {
  id: number;
  shopId: number;
  userId: number;
  gstCertificate?: string; // File URL
  panCard?: string; // File URL
  aadhaarCard?: string; // File URL
  businessLicense?: string; // File URL
  bankAccountProof?: string; // File URL
  ownerIdProof?: string; // File URL
  documentDetails: string; // JSON
  status: string; // 'pending', 'approved', 'rejected', 'needs_revision'
  rejectionReason?: string;
  verifiedBy?: number; // SuperAdmin ID
  verifiedAt?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class KYCVerification extends Model<IKYCVerification> implements IKYCVerification {
  declare id: number;
  declare shopId: number;
  declare userId: number;
  declare gstCertificate?: string;
  declare panCard?: string;
  declare aadhaarCard?: string;
  declare businessLicense?: string;
  declare bankAccountProof?: string;
  declare ownerIdProof?: string;
  declare documentDetails: string;
  declare status: string;
  declare rejectionReason?: string;
  declare verifiedBy?: number;
  declare verifiedAt?: Date;
  declare expiryDate?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare shop?: any;
  declare user?: any;
  declare verifier?: any;
}

KYCVerification.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  shopId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'Shops', key: 'id' },
    unique: true
  },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  gstCertificate: { type: DataTypes.STRING(500) },
  panCard: { type: DataTypes.STRING(500) },
  aadhaarCard: { type: DataTypes.STRING(500) },
  businessLicense: { type: DataTypes.STRING(500) },
  bankAccountProof: { type: DataTypes.STRING(500) },
  ownerIdProof: { type: DataTypes.STRING(500) },
  documentDetails: { type: DataTypes.JSON, defaultValue: {} },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'needs_revision'), defaultValue: 'pending' },
  rejectionReason: { type: DataTypes.TEXT },
  verifiedBy: { 
    type: DataTypes.INTEGER,
    references: { model: 'super_admins', key: 'id' }
  },
  verifiedAt: { type: DataTypes.DATE },
  expiryDate: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  tableName: 'kyc_verifications',
  timestamps: true,
  indexes: [
    { fields: ['shopId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

export default KYCVerification;
