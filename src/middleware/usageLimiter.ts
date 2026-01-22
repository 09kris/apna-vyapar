import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Shop, Subscription, Plan } from '../models';
import { ApiError } from './errorHandler';

/**
 * Middleware to check if shop has exceeded feature limits based on subscription plan
 * Should be added to routes that create products, orders, employees, etc.
 */

export interface UsageCheckOptions {
  resource: 'product' | 'order' | 'employee' | 'location' | 'api_call';
  required?: {
    advancedAnalytics?: boolean;
    apiAccess?: boolean;
    customDomain?: boolean;
    multipleLocations?: boolean;
    paymentGateway?: boolean;
  };
}

export const checkUsageLimit = (options: UsageCheckOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      if (!userId) throw new ApiError('Unauthorized', 401);

      // Get shop
      const shop = await Shop.findOne({ where: { ownerId: userId } });
      if (!shop) throw new ApiError('Shop not found', 404);

      // Get subscription and plan
      const subscription: any = await Subscription.findOne({
        where: { shopId: shop.id },
        include: [{ association: 'plan' }]
      });

      if (!subscription) throw new ApiError('No active subscription', 402);
      if (subscription.status !== 'active') throw new ApiError('Subscription is not active', 402);

      const plan: any = subscription.plan;

      // Check feature requirements
      if (options.required) {
        if (options.required.advancedAnalytics && !plan.hasAdvancedAnalytics) {
          throw new ApiError('Advanced Analytics is not available in your plan', 403);
        }
        if (options.required.apiAccess && !plan.hasAPIAccess) {
          throw new ApiError('API Access is not available in your plan', 403);
        }
        if (options.required.customDomain && !plan.hasCustomDomain) {
          throw new ApiError('Custom Domain is not available in your plan', 403);
        }
        if (options.required.multipleLocations && !plan.hasMultipleLocations) {
          throw new ApiError('Multiple Locations is not available in your plan', 403);
        }
        if (options.required.paymentGateway && !plan.hasPaymentGateway) {
          throw new ApiError('Payment Gateway integration is not available in your plan', 403);
        }
      }

      // Check usage limits based on resource type
      switch (options.resource) {
        case 'product': {
          const { Product } = require('../models');
          const productCount = await Product.count({ where: { shopId: shop.id } });
          if (productCount >= plan.productCountLimit) {
            throw new ApiError(
              `Product limit reached (${plan.productCountLimit}). Upgrade your plan to add more products.`,
              429
            );
          }
          break;
        }

        case 'order': {
          const { Order } = require('../models');
          const orderCount = await Order.count({
            where: {
              shopId: shop.id,
              createdAt: {
                [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          });
          if (orderCount >= plan.orderCountLimit) {
            throw new ApiError(
              `Order limit reached for this month (${plan.orderCountLimit}). Upgrade your plan to process more orders.`,
              429
            );
          }
          break;
        }

        case 'employee': {
          const { Employee } = require('../models');
          const employeeCount = await Employee.count({ where: { shopId: shop.id } });
          if (employeeCount >= plan.employeeCountLimit) {
            throw new ApiError(
              `Employee limit reached (${plan.employeeCountLimit}). Upgrade your plan to add more employees.`,
              429
            );
          }
          break;
        }

        case 'location': {
          const { Location } = require('../models');
          if (!plan.hasMultipleLocations) {
            throw new ApiError('Multiple locations not available in your plan', 403);
          }
          const locationCount = await Location.count({ where: { shopId: shop.id } });
          // Multiple locations plans might have a limit (optional)
          // if (locationCount >= plan.locationCountLimit) {
          //   throw new ApiError('Location limit reached', 429);
          // }
          break;
        }

        case 'api_call': {
          if (!plan.hasAPIAccess) {
            throw new ApiError('API Access not available in your plan', 403);
          }
          // Could implement rate limiting here
          break;
        }
      }

      // Store plan info in request for use in controller
      (req as any).userPlan = plan;
      (req as any).userSubscription = subscription;
      
      next();
    } catch (error: any) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.statusCode === 402 ? 'SUBSCRIPTION_INACTIVE' : 
                    error.statusCode === 403 ? 'FEATURE_NOT_AVAILABLE' : 
                    'USAGE_LIMIT_EXCEEDED'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error checking usage limits',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  };
};

/**
 * Middleware to track API calls for analytics (if applicable to plan)
 */
export const trackApiCall = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return next();

    // Store start time for response time tracking
    (req as any).startTime = Date.now();

    // Hook into response to track the call
    const originalSend = res.send;
    res.send = function (data: any) {
      const responseTime = Date.now() - (req as any).startTime;
      
      // In production, could log to analytics service
      console.log({
        userId,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        timestamp: new Date()
      });

      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    next();
  }
};

export default checkUsageLimit;
