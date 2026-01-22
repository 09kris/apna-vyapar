import { DataTypes, Model } from 'sequelize';
import bcryptjs from 'bcryptjs';
import { sequelize } from '../config/database';

export interface IUser {
  id?: number;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'owner' | 'employee' | 'retail_customer' | 'wholesale_customer' | 'guest' | 'admin';
  shopId?: number;
  profileImage?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class User extends Model<IUser> implements IUser {
  public id!: number;
  public fullName!: string;
  public email!: string;
  public phone!: string;
  public passwordHash!: string;
  public role!: 'owner' | 'employee' | 'retail_customer' | 'wholesale_customer' | 'guest' | 'admin';
  public shopId?: number;
  public profileImage?: string;
  public dateOfBirth?: Date;
  public gender?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public pincode?: string;
  public isActive!: boolean;
  public isVerified!: boolean;
  public emailVerifiedAt?: Date;
  public phoneVerifiedAt?: Date;
  public lastLogin?: Date;
  public loginAttempts!: number;
  public lockedUntil?: Date;
  public passwordResetToken?: string;
  public passwordResetExpires?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public deletedAt?: Date;

  async comparePassword(password: string): Promise<boolean> {
    return await bcryptjs.compare(password, this.passwordHash);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('owner', 'employee', 'retail_customer', 'wholesale_customer', 'guest', 'admin'),
      defaultValue: 'guest',
    },
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Shops',
        key: 'id',
      },
    },
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phoneVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['shopId'] },
      { fields: ['role'] },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        const salt = await bcryptjs.genSalt(10);
        user.passwordHash = await bcryptjs.hash(user.passwordHash, salt);
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('passwordHash')) {
          const salt = await bcryptjs.genSalt(10);
          user.passwordHash = await bcryptjs.hash(user.passwordHash, salt);
        }
      },
    },
  }
);

export default User;
