# Apna Vyapar - Complete API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 🔐 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "Password@123",
  "role": "owner"
}
```

**Response (201)**:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "owner"
  }
}
```

---

### 2. Login User
**POST** `/auth/login`

**Request**:
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Response (200)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "owner",
    "shopId": null
  }
}
```

---

### 3. Get Profile
**GET** `/auth/profile`
**Auth**: Required

**Response (200)**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "owner",
  "isActive": true,
  "lastLogin": "2026-01-22T10:30:00.000Z",
  "createdAt": "2026-01-20T12:00:00.000Z"
}
```

---

### 4. Logout
**POST** `/auth/logout`
**Auth**: Required

**Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

---

## 🏪 Shop Endpoints

### 1. Create Shop
**POST** `/shops`
**Auth**: Required | **Role**: owner, admin

**Request**:
```json
{
  "shopName": "ABC Electronics",
  "shopType": "retail",
  "category": "Electronics",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "phone": "9876543210",
  "alternatePhone": "9876543211",
  "email": "shop@abc.com",
  "gstNumber": "18AABCT1234A1Z0",
  "panNumber": "AAAPE1234A",
  "description": "Best electronics store",
  "openingTime": "09:00",
  "closingTime": "21:00"
}
```

**Response (201)**:
```json
{
  "message": "Shop created successfully",
  "shop": {
    "id": "507f1f77bcf86cd799439012",
    "shopName": "ABC Electronics",
    "referralCode": "ABC12345",
    "category": "Electronics",
    "city": "Mumbai",
    "isActive": true,
    "isVerified": false,
    "totalOrders": 0,
    "totalRevenue": 0
  }
}
```

---

### 2. Get All Shops
**GET** `/shops`

**Query Parameters**:
- `city` - Filter by city
- `category` - Filter by category
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 10)

**Response (200)**:
```json
{
  "shops": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "shopName": "ABC Electronics",
      "category": "Electronics",
      "city": "Mumbai",
      "phone": "9876543210",
      "totalOrders": 15,
      "totalRevenue": 500000,
      "isActive": true
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

### 3. Get Shop Details
**GET** `/shops/:shopId`

**Response (200)**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "shopName": "ABC Electronics",
  "category": "Electronics",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "phone": "9876543210",
  "email": "shop@abc.com",
  "gstNumber": "18AABCT1234A1Z0",
  "referralCode": "ABC12345",
  "isActive": true,
  "isVerified": false,
  "totalOrders": 15,
  "totalRevenue": 500000,
  "createdAt": "2026-01-20T12:00:00.000Z",
  "updatedAt": "2026-01-22T10:00:00.000Z"
}
```

---

### 4. Update Shop
**PUT** `/shops/:shopId`
**Auth**: Required | **Role**: owner, admin

**Request**:
```json
{
  "shopName": "ABC Electronics Store",
  "description": "Updated description",
  "openingTime": "08:00",
  "closingTime": "22:00",
  "phone": "9876543210",
  "email": "newemail@abc.com"
}
```

**Response (200)**:
```json
{
  "message": "Shop updated successfully",
  "shop": { ...updated shop object... }
}
```

---

## 📦 Product Endpoints

### 1. Create Product
**POST** `/products`
**Auth**: Required | **Role**: owner, employee, admin

**Request**:
```json
{
  "shopId": "507f1f77bcf86cd799439012",
  "categoryId": "507f1f77bcf86cd799439013",
  "productCode": "PHONE001",
  "productName": "iPhone 14",
  "description": "Latest Apple smartphone",
  "brand": "Apple",
  "retailPrice": 79999,
  "wholesalePrice": 70000,
  "costPrice": 60000,
  "mrp": 79999,
  "taxPercentage": 12,
  "stockQuantity": 50,
  "reorderLevel": 10,
  "maxStockLevel": 200,
  "unit": "piece",
  "weight": 172,
  "dimensions": "146x71x7.8",
  "warrantyMonths": 12,
  "returnDays": 7
}
```

**Response (201)**:
```json
{
  "message": "Product created successfully",
  "product": {
    "id": "507f1f77bcf86cd799439014",
    "productCode": "PHONE001",
    "productName": "iPhone 14",
    "retailPrice": 79999,
    "wholesalePrice": 70000,
    "stockQuantity": 50,
    "isActive": true
  }
}
```

---

### 2. Get Products
**GET** `/products`

**Query Parameters**:
- `shopId` - Filter by shop (required for browsing)
- `categoryId` - Filter by category
- `search` - Search by product name
- `inStock` - true/false (only in-stock items)
- `page` - Page number
- `limit` - Records per page

**Response (200)**:
```json
{
  "products": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "productName": "iPhone 14",
      "productCode": "PHONE001",
      "retailPrice": 79999,
      "wholesalePrice": 70000,
      "stockQuantity": 50,
      "category": "Smartphones"
    }
  ],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 20
  }
}
```

---

### 3. Get Product Details
**GET** `/products/:productId`

**Response (200)**:
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "productCode": "PHONE001",
  "productName": "iPhone 14",
  "description": "Latest Apple smartphone",
  "brand": "Apple",
  "retailPrice": 79999,
  "wholesalePrice": 70000,
  "costPrice": 60000,
  "taxPercentage": 12,
  "stockQuantity": 50,
  "reorderLevel": 10,
  "unit": "piece",
  "isActive": true,
  "createdAt": "2026-01-20T12:00:00.000Z"
}
```

---

### 4. Update Product
**PUT** `/products/:productId`
**Auth**: Required

**Request**:
```json
{
  "productName": "iPhone 14 Pro",
  "description": "Updated description",
  "retailPrice": 89999,
  "wholesalePrice": 80000,
  "stockQuantity": 45,
  "tags": ["5G", "camera", "latest"]
}
```

**Response (200)**:
```json
{
  "message": "Product updated successfully",
  "product": { ...updated product... }
}
```

---

### 5. Delete Product
**DELETE** `/products/:productId`
**Auth**: Required

**Response (200)**:
```json
{
  "message": "Product deleted successfully"
}
```

---

## 📂 Category Endpoints

### 1. Get Categories
**GET** `/categories`

**Query Parameters**:
- `shopId` - Filter by shop

**Response (200)**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "categoryName": "Smartphones",
    "description": "Mobile phones and accessories",
    "sortOrder": 1,
    "isActive": true
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "categoryName": "Laptops",
    "description": "Laptop computers",
    "sortOrder": 2,
    "parentCategoryId": "507f1f77bcf86cd799439013"
  }
]
```

---

### 2. Create Category
**POST** `/categories`
**Auth**: Required

**Request**:
```json
{
  "shopId": "507f1f77bcf86cd799439012",
  "categoryName": "Electronics",
  "description": "Electronic items",
  "parentCategoryId": null
}
```

**Response (201)**:
```json
{
  "message": "Category created successfully",
  "category": {
    "id": "507f1f77bcf86cd799439015",
    "categoryName": "Electronics",
    "isActive": true
  }
}
```

---

### 3. Update Category
**PUT** `/categories/:categoryId`
**Auth**: Required

**Request**:
```json
{
  "categoryName": "Electronics & Gadgets",
  "description": "Updated description"
}
```

**Response (200)**:
```json
{
  "message": "Category updated successfully",
  "category": { ...updated category... }
}
```

---

### 4. Delete Category
**DELETE** `/categories/:categoryId`
**Auth**: Required

**Response (200)**:
```json
{
  "message": "Category deleted successfully"
}
```

---

## 🛒 Order Endpoints

### 1. Create Order
**POST** `/orders`
**Auth**: Required

**Request**:
```json
{
  "shopId": "507f1f77bcf86cd799439012",
  "customerId": "507f1f77bcf86cd799439016",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439014",
      "quantity": 2,
      "discountPercentage": 5
    },
    {
      "productId": "507f1f77bcf86cd799439017",
      "quantity": 1,
      "discountPercentage": 0
    }
  ],
  "orderType": "retail",
  "paymentMethod": "cash",
  "deliveryAddress": "123 Customer Street, Mumbai",
  "customerNotes": "Gift wrapping preferred"
}
```

**Response (201)**:
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "507f1f77bcf86cd799439018",
    "orderNumber": "ORDER-202601-12345",
    "totalAmount": 159998.40,
    "orderStatus": "pending",
    "paymentStatus": "unpaid"
  }
}
```

---

### 2. Get Orders
**GET** `/orders`

**Query Parameters**:
- `shopId` - Filter by shop
- `customerId` - Filter by customer
- `orderStatus` - pending | confirmed | packed | shipped | delivered | cancelled
- `page` - Page number
- `limit` - Records per page

**Response (200)**:
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "orderNumber": "ORDER-202601-12345",
      "orderStatus": "pending",
      "paymentStatus": "unpaid",
      "totalAmount": 159998.40,
      "customer": "Rajesh Kumar",
      "createdAt": "2026-01-22T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

---

### 3. Get Order Details
**GET** `/orders/:orderId`

**Response (200)**:
```json
{
  "_id": "507f1f77bcf86cd799439018",
  "orderNumber": "ORDER-202601-12345",
  "orderStatus": "pending",
  "paymentStatus": "unpaid",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439014",
      "productName": "iPhone 14",
      "quantity": 2,
      "unitPrice": 79999,
      "discountAmount": 8000,
      "taxAmount": 17280,
      "totalPrice": 151998.40
    }
  ],
  "subtotal": 159998,
  "taxAmount": 17280,
  "discountAmount": 8000,
  "totalAmount": 169278,
  "paidAmount": 0,
  "balanceAmount": 169278,
  "deliveryAddress": "123 Customer Street, Mumbai",
  "createdAt": "2026-01-22T10:30:00.000Z"
}
```

---

### 4. Update Order Status
**PATCH** `/orders/:orderId/status`
**Auth**: Required

**Request**:
```json
{
  "orderStatus": "confirmed"
}
```

**Response (200)**:
```json
{
  "message": "Order status updated",
  "order": {
    "orderNumber": "ORDER-202601-12345",
    "orderStatus": "confirmed",
    "updatedAt": "2026-01-22T10:35:00.000Z"
  }
}
```

---

### 5. Record Payment
**POST** `/orders/:orderId/payment`
**Auth**: Required

**Request**:
```json
{
  "paidAmount": 85000,
  "paymentMethod": "card"
}
```

**Response (200)**:
```json
{
  "message": "Payment recorded",
  "order": {
    "orderNumber": "ORDER-202601-12345",
    "paidAmount": 85000,
    "balanceAmount": 84278,
    "paymentStatus": "partial"
  }
}
```

---

## 👥 Customer Endpoints

### 1. Register Customer via Referral Code
**POST** `/customers/register`

**Request**:
```json
{
  "referralCode": "ABC12345",
  "fullName": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "9876543211",
  "customerType": "retail",
  "address": "123 Main Road",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400002"
}
```

**Response (201)**:
```json
{
  "message": "Customer registered successfully",
  "customer": {
    "id": "507f1f77bcf86cd799439019",
    "fullName": "Rajesh Kumar",
    "customerType": "retail",
    "phone": "9876543211",
    "referralCodeUsed": "ABC12345",
    "creditLimit": 0,
    "loyaltyPoints": 0
  }
}
```

---

### 2. Get Customers
**GET** `/customers`

**Query Parameters**:
- `shopId` - Filter by shop
- `customerType` - retail | wholesale
- `isActive` - true | false | all

**Response (200)**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439019",
    "fullName": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "phone": "9876543211",
    "customerType": "retail",
    "totalPurchases": 50000,
    "loyaltyPoints": 500,
    "isActive": true,
    "lastPurchaseDate": "2026-01-22T10:30:00.000Z"
  }
]
```

---

### 3. Get Customer Details
**GET** `/customers/:customerId`

**Response (200)**:
```json
{
  "_id": "507f1f77bcf86cd799439019",
  "fullName": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "9876543211",
  "customerType": "retail",
  "address": "123 Main Road",
  "city": "Mumbai",
  "pincode": "400002",
  "totalPurchases": 50000,
  "lastPurchaseDate": "2026-01-22T10:30:00.000Z",
  "loyaltyPoints": 500,
  "creditLimit": 0,
  "outstandingBalance": 0,
  "isActive": true,
  "createdAt": "2026-01-15T12:00:00.000Z"
}
```

---

### 4. Update Customer
**PUT** `/customers/:customerId`
**Auth**: Required

**Request**:
```json
{
  "fullName": "Rajesh Kumar Singh",
  "address": "456 New Street",
  "creditLimit": 50000
}
```

**Response (200)**:
```json
{
  "message": "Customer updated",
  "customer": { ...updated customer... }
}
```

---

### 5. Add Loyalty Points
**POST** `/customers/:customerId/points`
**Auth**: Required

**Request**:
```json
{
  "points": 500
}
```

**Response (200)**:
```json
{
  "message": "Loyalty points updated",
  "customer": {
    "loyaltyPoints": 1000
  }
}
```

---

### 6. Set Credit Limit
**POST** `/customers/:customerId/credit-limit`
**Auth**: Required

**Request**:
```json
{
  "creditLimit": 100000
}
```

**Response (200)**:
```json
{
  "message": "Credit limit updated",
  "customer": {
    "creditLimit": 100000
  }
}
```

---

## 👨‍💼 Employee Endpoints

### 1. Create Employee
**POST** `/employees`
**Auth**: Required

**Request**:
```json
{
  "fullName": "Amit Singh",
  "email": "amit@example.com",
  "phone": "9876543212",
  "designation": "Sales Executive",
  "department": "Sales",
  "employmentType": "full-time",
  "salary": 25000,
  "joiningDate": "2024-01-15",
  "panNumber": "ABCDE1234F",
  "bankAccount": "1234567890",
  "bankIfsc": "HDFC0001234",
  "emergencyContact": "9876543213",
  "emergencyContactName": "Family Member"
}
```

**Response (201)**:
```json
{
  "message": "Employee created successfully",
  "employee": {
    "id": "507f1f77bcf86cd799439020",
    "employeeCode": "EMP-1705339200000",
    "fullName": "Amit Singh",
    "designation": "Sales Executive",
    "salary": 25000,
    "isActive": true
  }
}
```

---

### 2. Get Employees
**GET** `/employees`

**Query Parameters**:
- `shopId` - Filter by shop
- `designation` - Filter by designation
- `isActive` - true | false | all

**Response (200)**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "employeeCode": "EMP-1705339200000",
    "fullName": "Amit Singh",
    "email": "amit@example.com",
    "designation": "Sales Executive",
    "department": "Sales",
    "salary": 25000,
    "joiningDate": "2024-01-15",
    "isActive": true
  }
]
```

---

### 3. Get Employee Details
**GET** `/employees/:employeeId`

**Response (200)**:
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "employeeCode": "EMP-1705339200000",
  "fullName": "Amit Singh",
  "email": "amit@example.com",
  "phone": "9876543212",
  "designation": "Sales Executive",
  "department": "Sales",
  "employmentType": "full-time",
  "salary": 25000,
  "joiningDate": "2024-01-15",
  "panNumber": "ABCDE1234F",
  "bankAccount": "1234567890",
  "bankIfsc": "HDFC0001234",
  "isActive": true,
  "createdAt": "2024-01-15T12:00:00.000Z"
}
```

---

### 4. Update Employee
**PUT** `/employees/:employeeId`
**Auth**: Required

**Request**:
```json
{
  "designation": "Senior Sales Executive",
  "salary": 30000,
  "department": "Sales & Marketing"
}
```

**Response (200)**:
```json
{
  "message": "Employee updated",
  "employee": { ...updated employee... }
}
```

---

### 5. Terminate Employee
**POST** `/employees/:employeeId/terminate`
**Auth**: Required

**Request**:
```json
{
  "terminationReason": "Resignation accepted"
}
```

**Response (200)**:
```json
{
  "message": "Employee terminated",
  "employee": {
    "isActive": false,
    "terminationDate": "2026-01-22T10:30:00.000Z"
  }
}
```

---

## 💰 Payroll Endpoints

### 1. Calculate Payroll
**POST** `/payroll`
**Auth**: Required

**Request**:
```json
{
  "employeeId": "507f1f77bcf86cd799439020",
  "salaryMonth": "2026-01",
  "workingDays": 26,
  "leaveDays": 0,
  "hra": 5000,
  "medicalAllowance": 1000,
  "transportAllowance": 2000,
  "otherAllowances": 0,
  "pfDeduction": 3000,
  "taxDeduction": 2500,
  "loanDeduction": 0,
  "otherDeductions": 0,
  "overtimeHours": 0,
  "bonus": 5000
}
```

**Response (201)**:
```json
{
  "message": "Payroll calculated successfully",
  "payroll": {
    "id": "507f1f77bcf86cd799439021",
    "salaryMonth": "2026-01",
    "basicSalary": 25000,
    "grossSalary": 33000,
    "totalDeductions": 5500,
    "netSalary": 32500,
    "paymentStatus": "pending"
  }
}
```

---

### 2. Get Payroll Records
**GET** `/payroll`

**Query Parameters**:
- `shopId` - Filter by shop
- `employeeId` - Filter by employee
- `salaryMonth` - Filter by month (YYYY-MM)
- `paymentStatus` - pending | paid | hold

**Response (200)**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439021",
    "salaryMonth": "2026-01",
    "employee": {
      "_id": "507f1f77bcf86cd799439020",
      "employeeCode": "EMP-1705339200000"
    },
    "basicSalary": 25000,
    "hra": 5000,
    "medicalAllowance": 1000,
    "transportAllowance": 2000,
    "grossSalary": 33000,
    "pfDeduction": 3000,
    "taxDeduction": 2500,
    "totalDeductions": 5500,
    "netSalary": 32500,
    "paymentStatus": "pending"
  }
]
```

---

### 3. Get Payroll Details
**GET** `/payroll/:payrollId`

**Response (200)**:
```json
{
  "_id": "507f1f77bcf86cd799439021",
  "salaryMonth": "2026-01",
  "employee": { ...employee details... },
  "basicSalary": 25000,
  "hra": 5000,
  "medicalAllowance": 1000,
  "transportAllowance": 2000,
  "otherAllowances": 0,
  "grossSalary": 33000,
  "pfDeduction": 3000,
  "taxDeduction": 2500,
  "loanDeduction": 0,
  "otherDeductions": 0,
  "totalDeductions": 5500,
  "netSalary": 32500,
  "workingDays": 26,
  "leaveDays": 0,
  "overtimeHours": 0,
  "overtimeAmount": 0,
  "bonus": 5000,
  "paymentStatus": "pending",
  "createdAt": "2026-01-20T12:00:00.000Z"
}
```

---

### 4. Record Payment
**PATCH** `/payroll/:payrollId/pay`
**Auth**: Required

**Request**:
```json
{
  "paymentMode": "bank",
  "paymentReference": "TXN123456"
}
```

**Response (200)**:
```json
{
  "message": "Payment recorded",
  "payroll": {
    "paymentStatus": "paid",
    "paymentDate": "2026-01-22T10:30:00.000Z",
    "paymentMode": "bank"
  }
}
```

---

## 📍 Location Endpoints

### 1. Search Shops by Location
**GET** `/locations/search`

**Query Parameters**:
- `latitude` - User's latitude (required)
- `longitude` - User's longitude (required)
- `radius` - Search radius in km (default: 10)
- `category` - Filter by category
- `city` - Filter by city

**Response (200)**:
```json
{
  "shops": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "shopName": "ABC Electronics",
      "category": "Electronics",
      "city": "Mumbai",
      "phone": "9876543210",
      "distance": 2.5,
      "isActive": true
    },
    {
      "_id": "507f1f77bcf86cd799439022",
      "shopName": "XYZ Mobile Store",
      "category": "Electronics",
      "city": "Mumbai",
      "phone": "9876543220",
      "distance": 4.3,
      "isActive": true
    }
  ],
  "total": 2,
  "search": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "radius": 10
  }
}
```

---

### 2. Get Nearby Shops
**GET** `/locations/nearby`

**Query Parameters**:
- `latitude` - User's latitude (required)
- `longitude` - User's longitude (required)
- `radius` - Search radius in km (default: 5)

**Response (200)**:
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "shopName": "ABC Electronics",
    "category": "Electronics",
    "city": "Mumbai",
    "phone": "9876543210",
    "distance": 2.5
  },
  {
    "id": "507f1f77bcf86cd799439022",
    "shopName": "XYZ Mobile Store",
    "category": "Electronics",
    "city": "Mumbai",
    "phone": "9876543220",
    "distance": 4.3
  }
]
```

---

### 3. Create Location
**POST** `/locations`
**Auth**: Required

**Request**:
```json
{
  "shopId": "507f1f77bcf86cd799439012",
  "city": "Mumbai",
  "area": "Fort",
  "landmark": "Near CST Station",
  "pincode": "400001",
  "latitude": 18.9432,
  "longitude": 72.8349,
  "isPrimary": false
}
```

**Response (201)**:
```json
{
  "message": "Location created successfully",
  "location": {
    "id": "507f1f77bcf86cd799439023",
    "city": "Mumbai",
    "pincode": "400001",
    "isPrimary": false
  }
}
```

---

### 4. Get Shop Locations
**GET** `/locations/shop/:shopId`

**Response (200)**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439023",
    "city": "Mumbai",
    "area": "Fort",
    "landmark": "Near CST Station",
    "pincode": "400001",
    "latitude": 18.9432,
    "longitude": 72.8349,
    "isPrimary": true,
    "createdAt": "2026-01-20T12:00:00.000Z"
  }
]
```

---

## 📊 Analytics Endpoints

### 1. Sales Report
**GET** `/analytics/sales`

**Query Parameters**:
- `shopId` - Shop ID (required)
- `startDate` - Start date (ISO format, optional)
- `endDate` - End date (ISO format, optional)
- `groupBy` - daily | weekly | monthly (default: daily)

**Response (200)**:
```json
{
  "totalSales": 500000,
  "totalOrders": 25,
  "avgOrderValue": 20000,
  "retailSales": 350000,
  "wholesaleSales": 150000,
  "period": {
    "start": "2025-12-23T00:00:00.000Z",
    "end": "2026-01-22T23:59:59.999Z"
  }
}
```

---

### 2. Inventory Report
**GET** `/analytics/inventory`

**Query Parameters**:
- `shopId` - Shop ID (required)

**Response (200)**:
```json
{
  "totalProducts": 150,
  "totalValue": 2500000,
  "lowStock": 8,
  "overstock": 3,
  "deadStock": 5,
  "details": {
    "lowStockItems": [
      {
        "_id": "507f1f77bcf86cd799439024",
        "productName": "Product A",
        "stockQuantity": 2,
        "reorderLevel": 10
      }
    ],
    "overstockItems": [
      {
        "_id": "507f1f77bcf86cd799439025",
        "productName": "Product B",
        "stockQuantity": 250,
        "maxStockLevel": 200
      }
    ]
  }
}
```

---

### 3. Customer Analytics
**GET** `/analytics/customers`

**Query Parameters**:
- `shopId` - Shop ID (required)

**Response (200)**:
```json
{
  "totalCustomers": 150,
  "activeCustomers": 120,
  "wholesaleCustomers": 30,
  "totalRevenue": 2000000,
  "avgCustomerValue": 13333.33
}
```

---

### 4. Payroll Report
**GET** `/analytics/payroll`

**Query Parameters**:
- `shopId` - Shop ID (required)
- `salaryMonth` - Month filter (YYYY-MM, optional)

**Response (200)**:
```json
{
  "totalEmployees": 15,
  "totalSalary": 375000,
  "totalDeductions": 75000,
  "paidCount": 8,
  "pendingCount": 7,
  "averageSalary": 25000
}
```

---

### 5. Dashboard Summary
**GET** `/analytics/dashboard`

**Query Parameters**:
- `shopId` - Shop ID (required)

**Response (200)**:
```json
{
  "summary": {
    "totalRevenue": 500000,
    "totalOrders": 25,
    "totalCustomers": 150,
    "lowStockProducts": 8,
    "pendingPayroll": 7
  },
  "period": "Last 30 days"
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Missing required fields",
  "statusCode": 400
}
```

### 401 - Unauthorized
```json
{
  "error": "No token provided",
  "statusCode": 401
}
```

### 403 - Forbidden
```json
{
  "error": "Invalid or expired token",
  "statusCode": 403
}
```

### 404 - Not Found
```json
{
  "error": "Product not found",
  "statusCode": 404
}
```

### 409 - Conflict
```json
{
  "error": "Email or phone already registered",
  "statusCode": 409
}
```

### 500 - Server Error
```json
{
  "error": "Internal server error",
  "statusCode": 500,
  "message": "Error details (development only)"
}
```

---

## Rate Limiting

Coming Soon - Currently configured for unlimited requests
Recommended: 100 requests/minute per user

---

## Pagination

All list endpoints support pagination:

```json
{
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

**Default**: 20 items per page  
**Max**: 100 items per page

---

*API Reference - Last Updated: January 22, 2026*
