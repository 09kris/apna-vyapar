/**
 * Input Sanitization Utility for XSS Prevention
 * This utility provides functions to sanitize user inputs to prevent XSS attacks
 */

/**
 * HTML entities map for escaping
 */
const htmlEntities: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Regex pattern to match HTML special characters
 */
const htmlEntitiesPattern = /[&<>"'/]/g;

/**
 * Escape HTML special characters to prevent XSS
 * @param input - The * @returns San string to sanitize
itized string with HTML entities escaped
 */
export function escapeHtml(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(htmlEntitiesPattern, (match) => htmlEntities[match]);
}

/**
 * Strip HTML tags from string
 * @param input - The string to strip HTML from
 * @returns String without HTML tags
 */
export function stripHtml(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize object recursively - useful for request bodies
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeInput<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return escapeHtml(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeInput(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const sanitized: { [key: string]: any } = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip sensitive fields that shouldn't be sanitized
        const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken'];
        if (sensitiveFields.includes(key.toLowerCase())) {
          sanitized[key] = obj[key];
        } else {
          sanitized[key] = sanitizeInput(obj[key]);
        }
      }
    }
    
    return sanitized as T;
  }
  
  return obj;
}

/**
 * Validate and sanitize email
 * @param email - Email to validate
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string | undefined | null): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Validate and sanitize phone number
 * @param phone - Phone number to validate
 * @returns Sanitized phone or null if invalid
 */
export function sanitizePhone(phone: string | undefined | null): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  
  // Remove all non-digit characters except +
  const sanitized = phone.replace(/[^\d+]/g, '');
  
  // Basic validation - should be 10-15 digits
  if (sanitized.length >= 10 && sanitized.length <= 15) {
    return sanitized;
  }
  
  return null;
}

/**
 * Validate URL to prevent open redirect attacks
 * @param url - URL to validate
 * @returns Valid URL or null if invalid/unsafe
 */
export function sanitizeUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  try {
    const parsedUrl = url.toLowerCase();
    
    // Block javascript: and data: URLs first
    if (parsedUrl.startsWith('javascript:') || parsedUrl.startsWith('data:')) {
      return null;
    }
    
    const parsed = new URL(url);
    
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    
    return url;
  } catch {
    return null;
  }
}

/**
 * Sanitize string for use in SQL LIKE queries (escape special characters)
 * @param input - String to sanitize for SQL
 * @returns Sanitized string safe for SQL LIKE
 */
export function sanitizeSqlLike(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Escape special SQL LIKE characters: % _ [ 
  return input.replace(/[[\]%_]/g, (match) => `\\${match}`);
}

/**
 * Truncate string to max length (prevent buffer overflow)
 * @param input - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateString(input: string | undefined | null, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().slice(0, maxLength);
}

