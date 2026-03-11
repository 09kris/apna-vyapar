import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface UserAttributes {
  userId: string;
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  userType: 'SHOP_OWNER' | 'EMPLOYEE' | 'CUSTOMER' | 'ADMIN';
  isActive: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: Date;
  phoneVerified?: boolean;
  phoneVerificationToken?: string;
  phoneVerificationExpiresAt?: Date;
  otpAttempts?: number;
  otpLockedUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'userId' | 'isActive' | 'emailVerified'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public userId!: string;
  public email!: string;
  public phoneNumber?: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public profileImage?: string;
  public userType!: 'SHOP_OWNER' | 'EMPLOYEE' | 'CUSTOMER' | 'ADMIN';
  public isActive!: boolean;
  public emailVerified!: boolean;
  public emailVerificationToken?: string;
  public emailVerificationExpiresAt?: Date;
  public phoneVerified?: boolean;
  public phoneVerificationToken?: string;
  public phoneVerificationExpiresAt?: Date;
  public otpAttempts?: number;
  public otpLockedUntil?: Date;
  public passwordResetToken?: string;
  public passwordResetExpiresAt?: Date;
  public lastLogin?: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

User.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    userType: {
      type: DataTypes.ENUM('SHOP_OWNER', 'EMPLOYEE', 'CUSTOMER', 'ADMIN'),
      allowNull: false,
      defaultValue: 'CUSTOMER',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    emailVerificationExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    phoneVerificationToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    phoneVerificationExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    otpAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of failed OTP attempts for rate limiting',
    },
    otpLockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp until which OTP attempts are locked after too many failures',
    },
    passwordResetToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    passwordResetExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Users',
    timestamps: true,
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['phoneNumber'], unique: true },
      { fields: ['userType'] },
      { fields: ['isActive'] },
    ],
  },
);

export default User;
