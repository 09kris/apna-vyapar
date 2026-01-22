# Quick Start Guide - Apna Vyapar Backend

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/apna-vyapar
JWT_SECRET=dev_secret_key_123
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Start Server
```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
Environment: development
✅ MongoDB connected successfully
```

---

## 🧪 Testing the API

Use **Postman**, **Thunder Client**, or **cURL**

### 1️⃣ Health Check
```bash
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "uptime": 45.123
}
```

---

### 2️⃣ User Registration

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "Password@123",
    "role": "owner"
  }'
```

**Response:**
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

### 3️⃣ User Login

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password@123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
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

**Save the token for next requests!**

---

### 4️⃣ Create Shop

**Endpoint:** `POST /api/shops`

```bash
curl -X POST http://localhost:5000/api/shops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
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
    "email": "shop@abc.com",
    "description": "Best electronics store in Mumbai"
  }'
```

**Response:**
```json
{
  "message": "Shop created successfully",
  "shop": {
    "id": "507f1f77bcf86cd799439012",
    "shopName": "ABC Electronics",
    "referralCode": "ABC12345",
    "category": "Electronics",
    "city": "Mumbai"
  }
}
```

---

### 5️⃣ Create Product Category

**Endpoint:** `POST /api/categories`

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "shopId": "507f1f77bcf86cd799439012",
    "categoryName": "Smartphones",
    "description": "Mobile phones and accessories"
  }'
```

**Response:**
```json
{
  "message": "Category created successfully",
  "category": {
    "id": "507f1f77bcf86cd799439013",
    "shopId": "507f1f77bcf86cd799439012",
    "categoryName": "Smartphones"
  }
}
```

---

### 6️⃣ Create Product

**Endpoint:** `POST /api/products`

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "shopId": "507f1f77bcf86cd799439012",
    "categoryId": "507f1f77bcf86cd799439013",
    "productCode": "PHONE001",
    "productName": "iPhone 14",
    "description": "Latest iPhone model",
    "brand": "Apple",
    "retailPrice": 79999,
    "wholesalePrice": 70000,
    "costPrice": 60000,
    "taxPercentage": 12,
    "stockQuantity": 50,
    "reorderLevel": 10,
    "unit": "piece"
  }'
```

**Response:**
```json
{
  "message": "Product created successfully",
  "product": {
    "id": "507f1f77bcf86cd799439014",
    "productCode": "PHONE001",
    "productName": "iPhone 14",
    "retailPrice": 79999,
    "wholesalePrice": 70000,
    "stockQuantity": 50
  }
}
```

---

### 7️⃣ Register Customer

**Endpoint:** `POST /api/customers/register`

```bash
curl -X POST http://localhost:5000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "referralCode": "ABC12345",
    "fullName": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "phone": "9876543211",
    "customerType": "retail"
  }'
```

**Response:**
```json
{
  "message": "Customer registered successfully",
  "customer": {
    "id": "507f1f77bcf86cd799439015",
    "fullName": "Rajesh Kumar",
    "customerType": "retail",
    "phone": "9876543211"
  }
}
```

---

### 8️⃣ Create Order

**Endpoint:** `POST /api/orders`

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "shopId": "507f1f77bcf86cd799439012",
    "customerId": "507f1f77bcf86cd799439015",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439014",
        "quantity": 2,
        "discountPercentage": 5
      }
    ],
    "orderType": "retail",
    "paymentMethod": "cash",
    "deliveryAddress": "Rajesh Home, Mumbai"
  }'
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "507f1f77bcf86cd799439016",
    "orderNumber": "ORDER-202601-12345",
    "totalAmount": 151998.40,
    "orderStatus": "pending"
  }
}
```

---

### 9️⃣ Create Employee

**Endpoint:** `POST /api/employees`

```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
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
    "bankIfsc": "HDFC0001234"
  }'
```

**Response:**
```json
{
  "message": "Employee created successfully",
  "employee": {
    "id": "507f1f77bcf86cd799439017",
    "employeeCode": "EMP-1705339200000",
    "fullName": "Amit Singh",
    "designation": "Sales Executive"
  }
}
```

---

### 🔟 Calculate Payroll

**Endpoint:** `POST /api/payroll`

```bash
curl -X POST http://localhost:5000/api/payroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "employeeId": "507f1f77bcf86cd799439017",
    "salaryMonth": "2026-01",
    "workingDays": 26,
    "leaveDays": 0,
    "hra": 5000,
    "medicalAllowance": 1000,
    "transportAllowance": 2000,
    "pfDeduction": 3000,
    "taxDeduction": 2500,
    "bonus": 5000
  }'
```

**Response:**
```json
{
  "message": "Payroll calculated successfully",
  "payroll": {
    "id": "507f1f77bcf86cd799439018",
    "salaryMonth": "2026-01",
    "netSalary": 32500,
    "paymentStatus": "pending"
  }
}
```

---

## 📊 Analytics Endpoints

### Get Sales Report
```bash
curl -X GET "http://localhost:5000/api/analytics/sales?shopId=507f1f77bcf86cd799439012&groupBy=daily" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Get Inventory Report
```bash
curl -X GET "http://localhost:5000/api/analytics/inventory?shopId=507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Get Dashboard Summary
```bash
curl -X GET "http://localhost:5000/api/analytics/dashboard?shopId=507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 🗺️ Location Services

### Search Shops by Location
```bash
curl -X GET "http://localhost:5000/api/locations/search?latitude=19.0760&longitude=72.8777&radius=10&category=Electronics"
```

### Find Nearby Shops
```bash
curl -X GET "http://localhost:5000/api/locations/nearby?latitude=19.0760&longitude=72.8777&radius=5"
```

---

## 🔐 Common Headers

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## ❌ Error Responses

### Invalid Token
```json
{
  "error": "Invalid or expired token",
  "statusCode": 403
}
```

### Missing Fields
```json
{
  "error": "Missing required product details",
  "statusCode": 400
}
```

### Not Found
```json
{
  "error": "Product not found",
  "statusCode": 404
}
```

---

## 📝 Common Queries

### Get All Products for a Shop
```bash
curl -X GET "http://localhost:5000/api/products?shopId=507f1f77bcf86cd799439012&limit=20"
```

### Get Orders by Status
```bash
curl -X GET "http://localhost:5000/api/orders?shopId=507f1f77bcf86cd799439012&orderStatus=pending" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Get Employees by Shop
```bash
curl -X GET "http://localhost:5000/api/employees?shopId=507f1f77bcf86cd799439012&isActive=true" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Get Payroll Records
```bash
curl -X GET "http://localhost:5000/api/payroll?shopId=507f1f77bcf86cd799439012&salaryMonth=2026-01" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 🚀 Next Steps

1. **Test all endpoints** using Postman or Insomnia
2. **Build the frontend** (React/Vue/Angular)
3. **Connect frontend** to these backend APIs
4. **Deploy to production** (AWS, Heroku, etc.)
5. **Setup monitoring** (PM2, New Relic, etc.)
6. **Configure email** service (Gmail, SendGrid)
7. **Setup payment gateway** (Razorpay, Stripe)

---

## 💡 Tips

- Use Postman to save requests as collection
- Test endpoints with different roles (owner, employee, customer)
- Check database documents using MongoDB Compass
- Monitor server logs in terminal
- Keep tokens for session testing

---

## ⚠️ Important Notes

- Replace `<YOUR_TOKEN>` with actual JWT token from login
- All dates should be in ISO format
- Phone numbers should be 10 digits (India)
- Prices are in decimal format
- Shop IDs and Product IDs are MongoDB ObjectIds

---

**Happy Testing! 🎉**
