# Apna Vyapar - Shop Management System Backend

Professional-grade Shop Management System backend built with Node.js, TypeScript, and MongoDB.

## Project Overview

Apna Vyapar is a comprehensive multi-tenant platform for small to medium-sized retail and wholesale businesses. It enables centralized management of multiple shops with features including:

- **Shop Management**: Multi-location support, referral code system, shop verification
- **Inventory Management**: Product catalog, stock tracking, barcode/QR codes, low-stock alerts
- **Order Processing**: Retail/wholesale orders, payment handling, invoice generation
- **Employee & Payroll**: Employee onboarding, attendance, salary calculation, payroll management
- **Customer Management**: Customer registration, loyalty points, credit management
- **Geolocation Services**: Location-based shop discovery, distance calculation
- **Analytics & Reporting**: Sales reports, inventory analytics, customer insights

## Tech Stack

### Backend
- **Node.js 18.17.0** - Runtime
- **Express.js 4.18.2** - Web framework
- **TypeScript 5.3.3** - Language
- **MongoDB 6.0** - Database
- **Mongoose 8.0.0** - ODM
- **JWT 9.0.1** - Authentication
- **Bcryptjs 2.4.3** - Password hashing
- **Multer 1.4.5** - File uploads
- **Nodemailer 6.9.4** - Email service

## Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Steps

1. **Clone and navigate to project**
```bash
cd "Apna vyapar"
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/apna-vyapar
JWT_SECRET=your_super_secret_key
CORS_ORIGIN=http://localhost:3000
```

4. **Start development server**
```bash
npm run dev
```

Server will run on `http://localhost:5000`

5. **Build for production**
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── config/           # Configuration files
│   └── database.ts   # MongoDB connection
├── middleware/       # Middleware functions
│   ├── auth.ts      # JWT authentication
│   ├── errorHandler.ts
│   └── logger.ts
├── models/           # Database schemas
│   ├── User.ts
│   ├── Shop.ts
│   ├── Product.ts
│   ├── Order.ts
│   ├── Customer.ts
│   ├── Employee.ts
│   ├── Payroll.ts
│   ├── Category.ts
│   ├── InventoryTransaction.ts
│   ├── Notification.ts
│   ├── ReferralLog.ts
│   └── Location.ts
├── routes/           # API endpoints
│   ├── authRoutes.ts
│   ├── shopRoutes.ts
│   ├── productRoutes.ts
│   ├── orderRoutes.ts
│   ├── employeeRoutes.ts
│   ├── payrollRoutes.ts
│   ├── customerRoutes.ts
│   ├── locationRoutes.ts
│   ├── categoryRoutes.ts
│   └── analyticsRoutes.ts
├── utils/            # Utility functions
│   └── services.ts   # Email, SMS, barcode generation
└── index.ts          # Entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout

### Shops
- `POST /api/shops` - Create shop
- `GET /api/shops` - Get all shops (public)
- `GET /api/shops/:shopId` - Shop details
- `PUT /api/shops/:shopId` - Update shop

### Products
- `GET /api/products` - Get products
- `GET /api/products/:productId` - Product details
- `POST /api/products` - Create product
- `PUT /api/products/:productId` - Update product
- `DELETE /api/products/:productId` - Delete product

### Categories
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:categoryId` - Update category
- `DELETE /api/categories/:categoryId` - Delete category

### Orders
- `GET /api/orders` - Get orders
- `GET /api/orders/:orderId` - Order details
- `POST /api/orders` - Create order
- `PATCH /api/orders/:orderId/status` - Update status
- `POST /api/orders/:orderId/payment` - Record payment

### Customers
- `POST /api/customers/register` - Register via referral code
- `GET /api/customers` - Get customers
- `GET /api/customers/:customerId` - Customer details
- `PUT /api/customers/:customerId` - Update customer
- `POST /api/customers/:customerId/points` - Add loyalty points
- `POST /api/customers/:customerId/credit-limit` - Set credit limit

### Employees
- `POST /api/employees` - Create employee
- `GET /api/employees` - Get employees
- `GET /api/employees/:employeeId` - Employee details
- `PUT /api/employees/:employeeId` - Update employee
- `POST /api/employees/:employeeId/terminate` - Terminate employee

### Payroll
- `POST /api/payroll` - Calculate payroll
- `GET /api/payroll` - Get payroll records
- `GET /api/payroll/:payrollId` - Payroll details
- `PATCH /api/payroll/:payrollId/pay` - Record payment

### Locations
- `GET /api/locations/search` - Search shops by location
- `GET /api/locations/nearby` - Get nearby shops
- `POST /api/locations` - Create location
- `GET /api/locations/shop/:shopId` - Shop locations

### Analytics
- `GET /api/analytics/sales` - Sales report
- `GET /api/analytics/inventory` - Inventory report
- `GET /api/analytics/customers` - Customer analytics
- `GET /api/analytics/payroll` - Payroll report
- `GET /api/analytics/dashboard` - Dashboard summary

## Database Schema Highlights

### Key Collections
- **User**: Authentication and user profiles
- **Shop**: Multi-tenant shop data with referral codes
- **Product**: Inventory with dual pricing (retail/wholesale)
- **Order**: Comprehensive order management with line items
- **Customer**: Customer profiles with loyalty points
- **Employee**: Employee records with reporting structure
- **Payroll**: Salary calculations and payment tracking

### Key Features
- Soft delete support (deletedAt field)
- Timestamps on all records
- Geospatial indexing for location queries
- Role-based access control (RBAC)
- Full audit trail for inventory transactions

## Security Features

- ✅ JWT token-based authentication (24h expiry)
- ✅ Password hashing with Bcryptjs (10 salt rounds)
- ✅ Account lockout after 5 failed attempts
- ✅ CORS protection
- ✅ Input validation with Joi
- ✅ SQL injection prevention (MongoDB)
- ✅ XSS protection
- ✅ Rate limiting (ready for implementation)

## Error Handling

All endpoints follow consistent error response format:
```json
{
  "error": "Error message",
  "statusCode": 400,
  "details": "Additional context (development only)"
}
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/apna-vyapar
MONGODB_USERNAME=
MONGODB_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@apnavyapar.com

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

## Testing the API

Use Postman or Thunder Client to test:

### 1. Register
```
POST http://localhost:5000/api/auth/register
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "owner"
}
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Create Shop
```
POST http://localhost:5000/api/shops
Headers: Authorization: Bearer <token>
{
  "shopName": "ABC Electronics",
  "category": "Electronics",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "phone": "9876543210",
  "email": "shop@example.com"
}
```

## Future Enhancements

- [ ] Payment gateway integration
- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics with machine learning
- [ ] Mobile app (React Native/Flutter)
- [ ] Blockchain for supply chain
- [ ] AI-based demand forecasting
- [ ] Automated backup and disaster recovery
- [ ] Multi-language support

## Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for list endpoints
- Image compression for uploads
- Redis caching (ready to implement)
- Query optimization with projections
- Lazy loading support

## Compliance & Standards

- ✅ Indian GST compliance for invoices
- ✅ Indian labor law compliance (payroll)
- ✅ PF and ESI calculation support
- ✅ TDS calculation (Income Tax)
- ✅ Data privacy and security

## Support & Documentation

For detailed API documentation, refer to the Postman collection or Swagger docs (to be added).

## License

ISC

## Author

Apna Vyapar Team

---

**Happy Coding! 🚀**
