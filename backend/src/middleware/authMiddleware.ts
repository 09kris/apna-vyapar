import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError';
import User from '../models/User';

interface JwtPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  userInfo?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new ApiError(401, 'No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Not authenticated'));
      }

      // Use the userInfo already set by extended auth middleware if available
      if (req.userInfo) {
        if (!allowedRoles.includes(req.userInfo.userType)) {
          return next(new ApiError(403, 'Insufficient permissions'));
        }
        return next();
      }

      // Fallback: Query User model to check role
      // Add connection check before querying
      try {
        await User.sequelize?.authenticate();
      } catch (dbError) {
        console.error('Database connection error in role middleware:', dbError);
        return next(new ApiError(503, 'Database service unavailable. Please try again later.'));
      }

      const user = await User.findByPk(req.user.userId);

      if (!user) {
        return next(new ApiError(404, 'User not found'));
      }

      // Store userInfo for later use
      req.userInfo = {
        userId: user.userId,
        userType: user.userType,
        isActive: user.isActive
      };

      if (!allowedRoles.includes(user.userType)) {
        return next(new ApiError(403, 'Insufficient permissions'));
      }

      next();
    } catch (error: any) {
      console.error('Role middleware error:', error);
      
      // Handle specific database errors
      if (error.name === 'SequelizeConnectionRefusedError' || error.code === 'ECONNREFUSED') {
        return next(new ApiError(503, 'Database connection refused. Please ensure MySQL is running.'));
      }
      
      if (error.name === 'SequelizeDatabaseError') {
        return next(new ApiError(500, 'Database query error. Please contact administrator.'));
      }
      
      next(new ApiError(500, 'Authentication error'));
    }
  };
};
