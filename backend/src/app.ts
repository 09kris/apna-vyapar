import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
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

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  throw new ApiError(404, 'Route not found');
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
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
