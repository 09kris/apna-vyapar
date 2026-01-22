import { Model, DataTypes, Sequelize } from 'sequelize';

export interface IPlan {
  id: number;
  name: string; // 'Free', 'Basic', 'Pro'
  monthlyPrice: number;
  yearlyPrice: number;
  shopCountLimit: number;
  productCountLimit: number;
  orderCountLimit: number;
  employeeCountLimit: number;
  hasAdvancedAnalytics: boolean;
  hasAPIAccess: boolean;
  hasCustomDomain: boolean;
  hasMultipleLocations: boolean;
  hasPaymentGateway: boolean;
  hasEmailSupport: boolean;
  hasPrioritySupport: boolean;
  features: string; // JSON array of features
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Plan extends Model<IPlan> implements IPlan {
  declare id: number;
  declare name: string;
  declare monthlyPrice: number;
  declare yearlyPrice: number;
  declare shopCountLimit: number;
  declare productCountLimit: number;
  declare orderCountLimit: number;
  declare employeeCountLimit: number;
  declare hasAdvancedAnalytics: boolean;
  declare hasAPIAccess: boolean;
  declare hasCustomDomain: boolean;
  declare hasMultipleLocations: boolean;
  declare hasPaymentGateway: boolean;
  declare hasEmailSupport: boolean;
  declare hasPrioritySupport: boolean;
  declare features: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static initialize(sequelize: Sequelize) {
    Plan.init({
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      monthlyPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      yearlyPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      shopCountLimit: { type: DataTypes.INTEGER, defaultValue: 1 },
      productCountLimit: { type: DataTypes.INTEGER, defaultValue: 100 },
      orderCountLimit: { type: DataTypes.INTEGER, defaultValue: 1000 },
      employeeCountLimit: { type: DataTypes.INTEGER, defaultValue: 5 },
      hasAdvancedAnalytics: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasAPIAccess: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasCustomDomain: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasMultipleLocations: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasPaymentGateway: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasEmailSupport: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasPrioritySupport: { type: DataTypes.BOOLEAN, defaultValue: false },
      features: { type: DataTypes.JSON, defaultValue: [] },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE }
    }, {
      sequelize,
      tableName: 'plans',
      timestamps: true
    });

    return Plan;
  }
}

export default Plan;
