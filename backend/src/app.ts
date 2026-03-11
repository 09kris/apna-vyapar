import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import ApiError from './utils/ApiError';
import authRoutes from './routes/authRoutes';
import shopRoutes from './routes/shopRoutes';
import employeeRoutes from './routes/employeeRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import payrollRoutes from './routes/payrollRoutes';
import shopOrderRoutes from './routes/shopOrderRoutes';
import shopCustomerRoutes from './routes/shopCustomerRoutes';
import catalogRoutes from './routes/catalogRoutes';
import loyaltyRoutes from './routes/loyaltyRoutes';
import notificationRoutes from './routes/notificationRoutes';
import couponRoutes from './routes/couponRoutes';
import referralRoutes from './routes/referralRoutes';
import publicCatalogRoutes from './routes/publicCatalogRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import paymentRoutes from './routes/paymentRoutes';
import messageRoutes from './routes/messageRoutes';
import verificationRoutes from './routes/verificationRoutes';
import accountingRoutes from './routes/accountingRoutes';
import customerRoutes from './routes/customerRoutes';

const app: Express = express();

// Security Middleware

// 1. Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 2. CORS - Configure allowed origins
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:4200',
      'http://localhost:4000',
      'http://localhost:5000',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:5000',
    ];
    
    // In production, add your actual domain
    if (process.env.NODE_ENV === 'production' && process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 3. Rate Limiting - Prevent brute force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for development
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parser with size limit (prevent large payload attacks) - MUST be before routes
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting disabled for development
// app.use('/api/', generalLimiter);
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);

// Import sanitization middleware
// import { sanitizeInputMiddleware } from './middleware/sanitizeMiddleware';

// Apply sanitization to all API routes - DISABLED
// app.use('/api', sanitizeInputMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', payrollRoutes);
app.use('/api', shopOrderRoutes);
app.use('/api', shopCustomerRoutes);
app.use('/api', catalogRoutes);
app.use('/api', loyaltyRoutes);
app.use('/api', notificationRoutes);
app.use('/api', couponRoutes);
app.use('/api', referralRoutes);
app.use('/api', publicCatalogRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', paymentRoutes);
app.use('/api', messageRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api', accountingRoutes);
app.use('/api/customer', customerRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running' });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Route not found'));
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('==================');
  console.error('❌ ERROR DETAILS:');
  console.error('Message:', error.message);
  console.error('Status Code:', error.statusCode);
  console.error('Stack:', error.stack);
  console.error('Full Error Object:', error);
  console.error('==================');
  
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : 'Internal Server Error';

  res.status(statusCode).json({
    status: statusCode,
    message,
    data: null,
    success: false,
  });
});

export default app;
