# Apna Vyapar - Complete Architecture & Design Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Frontend)                      │
│              React.js / Vue.js / Angular SPA                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API / JSON
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   API GATEWAY (Express.js)                       │
│  • CORS • Rate Limiting • Request Logging • Authentication     │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐   ┌─────────▼────────┐  ┌──────▼──────────┐
│ Auth Service  │   │ Shop Service     │  │ Order Service   │
├───────────────┤   ├──────────────────┤  ├─────────────────┤
│ Register      │   │ Create Shop      │  │ Create Order    │
│ Login         │   │ Referral Code    │  │ Track Payment   │
│ JWT Tokens    │   │ Multi-location   │  │ Invoice Gen     │
│ RBAC          │   │ Verification     │  │ Status Update   │
└───────────────┘   └──────────────────┘  └─────────────────┘

┌───────────────┐   ┌──────────────────┐  ┌──────────────────┐
│ Inventory Svc │   │ Payroll Service  │  │ Analytics Svc    │
├───────────────┤   ├──────────────────┤  ├──────────────────┤
│ Product Mgmt  │   │ Salary Calc      │  │ Sales Reports    │
│ Stock Track   │   │ Payment Track    │  │ Customer Insights│
│ Reorder Alert │   │ Compliance Ready │  │ Inventory Health │
│ Categorize    │   │ Payroll History  │  │ Dashboard KPIs   │
└───────┬───────┘   └────────┬─────────┘  └─────────┬────────┘
        │                    │                      │
        └────────────────────┼──────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    MIDDLEWARE LAYER                              │
│  • Authentication • Authorization • Error Handling • Logging    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    DATA LAYER (Mongoose)                         │
│  • Model Definitions • Schema Validation • Business Logic       │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────────────────────────────────────────────────────┐
│                    DATABASE LAYER                             │
│                   MongoDB / Atlas                            │
├────────────────────────────────────────────────────────────┤
│ Collections:                                                │
│ • Users (Auth, Profiles, RBAC)                            │
│ • Shops (Multi-tenant, Referral Codes)                    │
│ • Products (Inventory, Pricing)                           │
│ • Orders (Complete Order Lifecycle)                       │
│ • Customers (Profiles, Loyalty, Credit)                  │
│ • Employees (Onboarding, Structure)                       │
│ • Payroll (Calculations, Payments)                        │
│ • Categories (Hierarchical)                                │
│ • Locations (Geospatial)                                  │
│ • Transactions (Audit Trail)                              │
│ • Notifications (User Alerts)                             │
│ • ReferralLogs (Tracking)                                 │
└────────────────────────────────────────────────────────────┘
```

---

## Database Design - Entity Relationship Diagram

```
USER (1) ──────────────── (1) SHOP
  │                          │
  │                          ├─────────── (M) PRODUCT
  │                          │              │
  │                          │              └──────── (1) CATEGORY
  │                          │
  │                          ├─────────── (M) CUSTOMER
  │                          │              │
  │                          │              └──────── (M) ORDER
  │                          │                          │
  │                          │                          └──── (M) ORDER_ITEMS
  │                          │                                     │
  │                          │                                     └─ (1) PRODUCT
  │                          │
  │                          ├─────────── (M) EMPLOYEE
  │                          │              │
  │                          │              └──────── (M) PAYROLL
  │                          │
  │                          └─────────── (M) LOCATION

REFERRAL_CODE (belongs to SHOP)
INVENTORY_TRANSACTION (logs PRODUCT movements)
NOTIFICATION (alerts to USER)
```

---

## Data Model Specifications

### 1. USER Model
**Purpose**: Authentication, Authorization, Profile Management

**Key Fields**:
- `fullName`, `email`, `phone` - Identity
- `passwordHash` - Bcrypt hashed
- `role` - owner | employee | retail_customer | wholesale_customer | guest | admin
- `shopId` - Reference to owned/associated shop
- `lastLogin` - Audit trail
- `loginAttempts`, `lockedUntil` - Security

**Indexes**:
- email (UNIQUE)
- phone (UNIQUE)
- role
- shopId

---

### 2. SHOP Model
**Purpose**: Multi-tenant separation, Shop details, Location services

**Key Fields**:
- `shopName`, `category` - Basic info
- `ownerId` - Reference to User
- `referralCode` - Unique 6-8 alphanumeric
- `latitude`, `longitude` - Geospatial
- `isActive`, `isVerified` - Status
- `totalOrders`, `totalRevenue` - KPIs

**Indexes**:
- referralCode (UNIQUE)
- ownerId
- city
- latitude + longitude (GEOSPATIAL)
- isActive

---

### 3. PRODUCT Model
**Purpose**: Inventory management, Dual pricing

**Key Fields**:
- `productCode` - SKU/Barcode
- `retailPrice`, `wholesalePrice` - Dual pricing
- `costPrice` - For profit calculation
- `stockQuantity`, `reorderLevel` - Stock management
- `taxPercentage` - GST/Tax
- `unit` - kg | piece | box | liter | dozen

**Indexes**:
- shopId
- categoryId
- productCode (UNIQUE)
- productName (TEXT for search)
- isActive

---

### 4. ORDER Model
**Purpose**: Complete order lifecycle

**Key Fields**:
- `orderNumber` - Unique sequential
- `items[]` - Array of ordered products with:
  - productId, quantity, unitPrice
  - discountPercentage, taxPercentage
  - subtotal, totalPrice
- `orderStatus` - pending | confirmed | packed | shipped | delivered | cancelled
- `paymentStatus` - unpaid | partial | paid
- `paymentMethod` - cash | card | upi | netbanking | credit

**Indexes**:
- orderNumber (UNIQUE)
- shopId
- customerId
- orderStatus
- createdAt (for reports)

---

### 5. CUSTOMER Model
**Purpose**: Customer profiles, Loyalty, Credit management

**Key Fields**:
- `referralCodeUsed` - Which code they used to register
- `customerType` - retail | wholesale
- `creditLimit` - For credit sales
- `outstandingBalance` - Pending payments
- `totalPurchases` - Lifetime value
- `loyaltyPoints` - Reward points

**Indexes**:
- shopId
- phone
- customerType
- isActive

---

### 6. EMPLOYEE Model
**Purpose**: Employee records, Hierarchy

**Key Fields**:
- `employeeCode` - Unique identifier
- `userId` - Link to user account
- `designation`, `department` - Job details
- `salary` - Base salary for payroll
- `reportingTo` - Manager reference
- `aadhaarNumber`, `panNumber` - ID proof
- `bankAccount`, `bankIfsc` - Payment details

**Indexes**:
- shopId
- employeeCode (UNIQUE)
- userId (UNIQUE)

---

### 7. PAYROLL Model
**Purpose**: Salary calculations, Payment tracking

**Key Fields**:
- `salaryMonth` - YYYY-MM format
- `basicSalary` - From employee record
- **Allowances**: HRA, Medical, Transport, Others
- **Deductions**: PF, Tax, Loan, Others
- `grossSalary` = basicSalary + allowances
- `totalDeductions` = all deductions
- `netSalary` = gross - deductions + overtime + bonus
- `paymentStatus` - pending | paid | hold

**Calculation Logic**:
```
Gross = Basic + HRA + Medical + Transport + Other
Deductions = PF + Tax + Loan + Other
NetSalary = Gross - Deductions + Overtime + Bonus
```

**Indexes**:
- employeeId
- shopId
- salaryMonth
- paymentStatus

---

### 8. CATEGORY Model
**Purpose**: Hierarchical product organization

**Key Fields**:
- `categoryName` - Category title
- `parentCategoryId` - For subcategories
- `sortOrder` - Display order

**Indexes**:
- shopId
- parentCategoryId (for hierarchy)
- isActive

---

### 9. LOCATION Model
**Purpose**: Multi-location support, Geolocation services

**Key Fields**:
- `shopId` - Associated shop
- `city`, `area`, `landmark` - Location details
- `latitude`, `longitude` - GPS coordinates
- `isPrimary` - Main location flag

**Indexes**:
- shopId
- city
- latitude + longitude (GEOSPATIAL)

---

### 10. INVENTORY_TRANSACTION Model
**Purpose**: Complete audit trail of stock movements

**Key Fields**:
- `transactionType` - purchase | sale | return | adjustment | damage
- `quantityChange` - +/- amount
- `previousStock`, `newStock` - Before/after
- `referenceType`, `referenceId` - Link to Order/Purchase
- `performedBy` - User who made change

**Indexes**:
- shopId
- productId
- transactionType
- createdAt (for audit reports)

---

### 11. NOTIFICATION Model
**Purpose**: User alerts and notifications

**Key Fields**:
- `notificationType` - order | stock | payment | system | payroll
- `title`, `message` - Notification content
- `priority` - low | normal | high | urgent
- `isRead`, `readAt` - Read status tracking

**Indexes**:
- userId
- isRead
- createdAt (for ordering)

---

### 12. REFERRAL_LOG Model
**Purpose**: Track referral code usage and performance

**Key Fields**:
- `referralCode` - Code used
- `customerId` - Customer who used it
- `totalOrders` - Orders via this referral
- `totalRevenue` - Revenue generated
- `deviceType` - mobile | desktop | tablet

**Indexes**:
- shopId
- referralCode
- usedAt

---

## API Design Patterns

### RESTful Conventions

```
GET    /api/resource           - List with pagination
POST   /api/resource           - Create
GET    /api/resource/:id       - Retrieve one
PUT    /api/resource/:id       - Full update
PATCH  /api/resource/:id       - Partial update
DELETE /api/resource/:id       - Delete

POST   /api/resource/:id/action - Custom action
```

### Response Format

**Success (2xx)**:
```json
{
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**Error (4xx/5xx)**:
```json
{
  "error": "Error message",
  "statusCode": 400,
  "details": { ... }
}
```

---

## Authentication & Authorization Flow

### 1. Registration
```
User → /api/auth/register → Hash password → Create user → Issue JWT
```

### 2. Login
```
User → /api/auth/login → Verify password → Check account lock → Issue JWT
```

### 3. Protected Request
```
Client → Request with JWT → Middleware verifies → Extract userId, role → Proceed
```

### 4. Role-Based Access
```
Middleware checks user.role → Allows/denies access → Returns 403 if denied
```

**Roles Hierarchy**:
1. **admin** - Full system access
2. **owner** - Shop management, reporting
3. **employee** - Order processing, inventory
4. **retail_customer** - Browse, purchase
5. **wholesale_customer** - Bulk ordering
6. **guest** - Browse only

---

## Payroll Calculation Engine

### Detailed Formula

```
GROSS SALARY CALCULATION:
├── Basic Salary (from employee record)
├── HRA (House Rent Allowance)
├── Medical Allowance
├── Transport Allowance
├── Other Allowances
└── Gross = Sum of above

DEDUCTION CALCULATION:
├── PF (Provident Fund) = 12% of basic
├── Tax (TDS) = Based on income slab
├── Loan Deduction = Monthly EMI
├── Other Deductions = Custom
└── Total Deductions = Sum of above

FINAL CALCULATION:
├── Net Salary = Gross - Deductions
├── Overtime Amount = Hours × (Daily Rate × 2)
├── Bonus = Discretionary
└── Final Net = Net Salary + Overtime + Bonus
```

### Compliance

- ✅ PF Calculation (12% employee + 12% employer)
- ✅ TDS as per IT slabs
- ✅ ESI eligibility check
- ✅ Gratuity calculation ready
- ✅ Form 16 generation support

---

## Order Processing Workflow

```
Customer Places Order
    ↓
├─ Validate customer, items
├─ Check stock availability
├─ Calculate pricing (retail/wholesale)
├─ Apply discounts
├─ Calculate taxes
└─ Create order (Status: PENDING)

Payment Recording
    ↓
├─ Record payment amount
├─ Update payment status
├─ Check if payment complete
└─ Update order if paid (Status: CONFIRMED)

Fulfillment
    ↓
├─ Pick items (Status: PACKED)
├─ Ship items (Status: SHIPPED)
└─ Deliver (Status: DELIVERED)

Cancellation (anytime)
    ↓
├─ Record reason
├─ Revert stock
└─ Update status (CANCELLED)
```

---

## Geolocation Services

### Haversine Distance Formula

```javascript
Distance = 2 × R × arcsin(√(sin²((lat2-lat1)/2) + cos(lat1) × cos(lat2) × sin²((lon2-lon1)/2)))

Where:
- R = Earth's radius (6371 km)
- lat, lon = Latitude/Longitude in radians
```

### Search Algorithm

1. Get user coordinates
2. Find all active shops in database
3. Calculate distance for each shop
4. Filter by radius parameter
5. Sort by distance (ascending)
6. Apply additional filters (category, etc.)
7. Return paginated results

---

## Error Handling Strategy

### Error Codes

```
400 - Bad Request (validation error)
401 - Unauthorized (no token)
403 - Forbidden (permission denied)
404 - Not Found
409 - Conflict (duplicate record)
429 - Too Many Requests (rate limit)
500 - Server Error
503 - Service Unavailable
```

### Error Handler Middleware

```typescript
try {
  // Route handler
} catch (error) {
  // Log error
  // Determine status code
  // Return structured error response
  // Don't expose sensitive details
}
```

---

## Performance Considerations

### Database Optimization

1. **Indexing Strategy**
   - UNIQUE indexes on email, phone, product code
   - COMPOUND indexes on (shopId, isActive)
   - GEOSPATIAL indexes for location queries
   - TEXT indexes for search fields

2. **Query Optimization**
   - Use projections to limit fields
   - Pagination for list endpoints
   - Aggregation pipeline for reports
   - Lazy loading for related documents

3. **Caching**
   - Redis for session storage
   - Cache referral codes lookup
   - Cache popular products
   - Cache shop profiles

### API Optimization

1. **Response Optimization**
   - Pagination (default 20 items)
   - Field filtering
   - Lazy loading of relationships

2. **Request Optimization**
   - Rate limiting
   - Request validation
   - Input sanitization

---

## Security Measures

### 1. Authentication
- ✅ JWT with secure payload
- ✅ 24-hour token expiry
- ✅ Refresh tokens for extended sessions

### 2. Password Security
- ✅ Bcryptjs hashing (10 salt rounds)
- ✅ Account lockout (5 attempts, 15 min)
- ✅ Password reset tokens

### 3. Authorization
- ✅ Role-based access control (RBAC)
- ✅ Resource-level permissions
- ✅ Multi-tenant data isolation

### 4. Data Protection
- ✅ Input validation
- ✅ SQL injection prevention (MongoDB)
- ✅ XSS protection
- ✅ CORS enabled
- ✅ HTTPS support (ready)

### 5. Audit Trail
- ✅ User action logging
- ✅ Inventory transaction history
- ✅ Payroll record tracking
- ✅ Order status history

---

## Deployment Architecture

### Development
```
Local Machine
├── Node.js + npm
├── MongoDB (local)
└── Environment: development
```

### Staging
```
Cloud Server (AWS/Heroku)
├── Node.js application
├── MongoDB Atlas
├── Cloudflare CDN
└── Environment: staging
```

### Production
```
Cloud Infrastructure
├── Load Balancer
├── Multiple App Servers (Node.js)
├── MongoDB Replica Set
├── Redis Cache
├── CDN (Cloudflare)
├── SSL/TLS Certificates
├── Monitoring (PM2, Winston)
├── Backup System
└── Environment: production
```

---

## Monitoring & Logging

### Logging Levels

```
DEBUG   - Detailed information
INFO    - General information
WARN    - Warning messages
ERROR   - Error information
FATAL   - Critical errors
```

### Metrics to Monitor

- Request/Response times
- Error rates
- Database connection pool
- Cache hit/miss ratio
- User authentication attempts
- API endpoint usage
- Server CPU/Memory
- Database query performance

---

## Scalability Strategy

### Horizontal Scaling

1. **Stateless Application Design**
   - JWT for session management
   - Redis for session store
   - No server-side sessions

2. **Load Balancing**
   - Nginx/HAProxy for load distribution
   - Health checks
   - Auto-scaling groups

3. **Database Scaling**
   - MongoDB replica sets
   - Sharding for large datasets
   - Read replicas

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Upgrade database server
3. Optimize code and queries

---

## Future Enhancement Architecture

### Phase 2: Payment Integration
```
Payment Gateway (Razorpay/Stripe)
    ↓
Order Service
    ↓
Update Order Status & Customer Balance
```

### Phase 3: Real-time Features
```
WebSocket Server
    ↓
├─ Order Updates
├─ Notification System
├─ Live Inventory
└─ Chat Support
```

### Phase 4: Advanced Analytics
```
Data Warehouse (BigQuery/Redshift)
    ↓
ML Models
    ↓
├─ Demand Forecasting
├─ Customer Segmentation
└─ Sales Predictions
```

---

## Compliance & Standards

### Data Privacy
- GDPR readiness
- Data retention policies
- User data export
- Right to be forgotten

### Financial Compliance
- GST calculation
- Invoice standards
- Audit trail
- Tax reporting

### Labor Compliance
- PF/ESI calculation
- Income Tax TDS
- Leave management
- Attendance tracking

---

## Testing Strategy

### Unit Tests
- Model validation
- Utility function tests
- Business logic tests

### Integration Tests
- API endpoint tests
- Database interaction tests
- Authentication flow tests

### E2E Tests
- Complete user journeys
- Order processing flow
- Payroll calculation
- Report generation

### Load Tests
- Concurrent user handling
- Database query performance
- API response times
- Memory leaks

---

## Documentation Requirements

- ✅ API documentation (this file + README)
- ✅ Database schema documentation
- ✅ Deployment guides
- ✅ Installation guides
- ✅ Code comments
- ✅ Error handling guide
- ✅ Security guidelines

---

**Last Updated**: January 22, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
