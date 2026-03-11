/**
 * Input Sanitization Middleware
 * Automatically sanitizes request body, query params, and URL params to prevent XSS
 */

import { Request, Response, NextFunction } from 'express';
import { sanitizeInput, truncateString } from '../utils/sanitize';

/**
 * Middleware to sanitize request body
 * Usage: sanitizeBody() - sanitizes all string fields in body
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🧹 Sanitize: Checking body for', req.method, req.url);
    
    if (req.body && typeof req.body === 'object') {
      console.log('🧹 Sanitize: Body exists, processing...');
      const truncatedBody = truncateObjectStrings(req.body, 5000);
      req.body = sanitizeInput(truncatedBody);
      console.log('🧹 Sanitize: Body sanitized successfully');
    } else {
      console.log('🧹 Sanitize: No body to sanitize');
    }
    next();
  } catch (error) {
    console.error('❌ Sanitize Error:', error);
    next(error);
  }
};

/**
 * Middleware to sanitize query parameters
 * Usage: sanitizeQuery()
 */
export const sanitizeQuery = (req: Request, res: Response, next: NextFunction) => {
  if (req.query && typeof req.query === 'object') {
    const sanitized = sanitizeInput(req.query);
    Object.keys(sanitized).forEach(key => {
      (req.query as any)[key] = sanitized[key];
    });
  }
  next();
};

/**
 * Middleware to sanitize URL parameters
 * Usage: sanitizeParams()
 */
export const sanitizeParams = (req: Request, res: Response, next: NextFunction) => {
  if (req.params && typeof req.params === 'object') {
    const sanitized = sanitizeInput(req.params);
    Object.keys(sanitized).forEach(key => {
      req.params[key] = sanitized[key];
    });
  }
  next();
};

/**
 * Combined sanitization middleware
 * Usage: sanitizeInputMiddleware()
 */
export const sanitizeInputMiddleware = [
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
];

/**
 * Truncate strings in an object to prevent buffer overflow
 */
function truncateObjectStrings(obj: any, maxLength: number): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return truncateString(obj, maxLength);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => truncateObjectStrings(item, maxLength));
  }
  
  if (typeof obj === 'object') {
    const truncated: { [key: string]: any } = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip binary data and files
        if (key === 'file' || key === 'files' || key === 'buffer') {
          truncated[key] = obj[key];
        } else {
          truncated[key] = truncateObjectStrings(obj[key], maxLength);
        }
      }
    }
    
    return truncated;
  }
  
  return obj;
}

export default sanitizeInputMiddleware;

