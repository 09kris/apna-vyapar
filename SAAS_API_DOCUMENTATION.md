# SaaS Subscription & Admin Panel - Complete API Documentation

## Overview

This document covers the complete implementation of:
1. **Subscription & Billing System** - Free/Basic/Pro plans with monthly/yearly billing
2. **Super Admin Panel** - Platform owner controls and shop management
3. **Admin Dashboard** - Analytics, KYC verification, abuse control

---

## TABLE OF CONTENTS

1. [Authentication](#authentication)
2. [Subscription Management](#subscription-management)
3. [Billing & Payments](#billing--payments)
4. [Admin Authentication](#admin-authentication)
5. [Admin Panel](#admin-panel)
6. [Feature Limits](#feature-limits)

---

## Authentication

### User Authentication
**Base Path:** `/api/auth`

Register and login users follow existing auth routes.

### Token Usage
All endpoints (except auth) require JWT token in Authorization header:
```
Authorization: Bearer {jwt_token}
```

---

## Subscription Management

**Base Path:** `/api/subscriptions`

### 1. Get Available Plans
```
GET /api/subscriptions/plans
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Free",
    "monthlyPrice": 0,
    "yearlyPrice": 0,
    "shopCountLimit": 1,
    "productCountLimit": 50,
    "orderCountLimit": 100,
    "employeeCountLimit": 3,
    "hasAdvancedAnalytics": false,
    "hasAPIAccess": false,
    "hasCustomDomain": false,
    "hasPaymentGateway": false,
    "isActive": true
  },
  {
    "id": 2,
    "name": "Basic",
    "monthlyPrice": 299,
    "yearlyPrice": 2990,
    "shopCountLimit": 2,
    "productCountLimit": 500,
    "orderCountLimit": 1000,
    "employeeCountLimit": 10,
    "hasAdvancedAnalytics": true,
    "hasAPIAccess": false,
    "hasPaymentGateway": true,
    "isActive": true
  },
  {
    "id": 3,
    "name": "Pro",
    "monthlyPrice": 999,
    "yearlyPrice": 9990,
    "shopCountLimit": 5,
    "productCountLimit": 5000,
    "orderCountLimit": 10000,
    "employeeCountLimit": 50,
    "hasAdvancedAnalytics": true,
    "hasAPIAccess": true,
    "hasPaymentGateway": true,
    "hasMultipleLocations": true,
    "isActive": true
  }
]
```

### 2. Get Specific Plan Details
```
GET /api/subscriptions/plans/:planId
```

**Response:** Single plan object (see above)

### 3. Get Current Shop Subscription
```
GET /api/subscriptions/my-subscription
Authentication: Required
```

**Response:**
```json
{
  "id": 5,
  "shopId": 10,
  "planId": 2,
  "billingCycle": "monthly",
  "startDate": "2024-01-15T10:30:00Z",
  "renewalDate": "2024-02-15T10:30:00Z",
  "endDate": null,
  "status": "active",
  "autoRenew": true,
  "currentUsage": {
    "products": 250,
    "orders": 520,
    "employees": 8
  },
  "isPaymentPending": false,
  "lastPaymentDate": "2024-01-15T10:30:00Z",
  "nextPaymentDate": "2024-02-15T10:30:00Z",
  "plan": { /* Plan object */ },
  "payments": [ /* Payment records */ ]
}
```

### 4. Select Plan
```
POST /api/subscriptions/select-plan
Authentication: Required

Body:
{
  "planId": 2,
  "billingCycle": "monthly"  // or "yearly"
}
```

**Response:**
```json
{
  "message": "Plan selected successfully",
  "subscription": { /* Full subscription object */ },
  "nextPayment": {
    "amount": 299,
    "dueDate": "2024-01-15T00:00:00Z"
  }
}
```

**Status Codes:**
- `201` - Plan selected successfully
- `400` - Missing required fields
- `404` - Plan not found
- `401` - Unauthorized

### 5. Get Billing History
```
GET /api/subscriptions/billing-history?page=1&limit=20
Authentication: Required
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "subscriptionId": 5,
      "shopId": 10,
      "planId": 2,
      "amount": 299,
      "billingCycle": "monthly",
      "paymentMethod": "card",
      "transactionId": "pi_1234567890",
      "status": "completed",
      "invoiceUrl": "https://...",
      "paidAt": "2024-01-15T10:30:00Z",
      "plan": { /* Plan object */ }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 6. Record Payment (After Successful Payment)
```
POST /api/subscriptions/record-payment
Authentication: Required

Body:
{
  "amount": 299,
  "transactionId": "pi_1234567890",
  "paymentMethod": "card",
  "paymentGateway": "stripe",
  "invoiceUrl": "https://invoices.stripe.com/..."
}
```

**Response:**
```json
{
  "message": "Payment recorded successfully",
  "payment": { /* Payment record */ },
  "subscription": { /* Updated subscription */ }
}
```

### 7. Get Feature Usage
```
GET /api/subscriptions/usage
Authentication: Required
```

**Response:**
```json
{
  "plan": {
    "name": "Basic",
    "features": [ "advanced_analytics", "payment_gateway" ]
  },
  "limits": {
    "productCountLimit": 500,
    "orderCountLimit": 1000,
    "employeeCountLimit": 10,
    "hasAdvancedAnalytics": true,
    "hasAPIAccess": false,
    "hasPaymentGateway": true
  },
  "usage": {
    "products": 250,
    "orders": 520,
    "employees": 8
  },
  "percentageUsed": {
    "products": "50.00",
    "orders": "52.00",
    "employees": "80.00"
  }
}
```

---

## Billing & Payments

**Base Path:** `/api/payments`

### 1. Create Razorpay Order
```
POST /api/payments/razorpay/create-order
Authentication: Required

Body:
{
  "planId": 2,
  "billingCycle": "monthly"
}
```

**Response:**
```json
{
  "order": {
    "id": "order_1234567890",
    "amount": 29900,
    "currency": "INR",
    "status": "created"
  },
  "key": "rzp_live_xxxxx",
  "shop": {
    "id": 10,
    "name": "My Shop",
    "email": "shop@example.com"
  },
  "plan": {
    "id": 2,
    "name": "Basic"
  },
  "amount": 299,
  "billingCycle": "monthly"
}
```

**Integration Steps:**
1. Frontend receives order data
2. Initialize Razorpay checkout with `order.id`
3. User completes payment
4. Razorpay calls webhook endpoint
5. Backend records payment automatically

### 2. Razorpay Webhook
```
POST /api/payments/razorpay/webhook
(No authentication - signature verified)

Headers:
X-Razorpay-Signature: {signature}
```

**Handles:**
- Payment authorized
- Subscription activated
- Renewal date set
- Shop reactivated if suspended

### 3. Create Stripe Payment Intent
```
POST /api/payments/stripe/create-payment-intent
Authentication: Required

Body:
{
  "planId": 2,
  "billingCycle": "monthly"
}
```

**Response:**
```json
{
  "clientSecret": "pi_1234567890_secret_xxxxx",
  "publishableKey": "pk_live_xxxxx",
  "shop": {
    "id": 10,
    "name": "My Shop",
    "email": "shop@example.com"
  },
  "plan": {
    "id": 2,
    "name": "Basic"
  },
  "amount": 299,
  "billingCycle": "monthly"
}
```

**Integration Steps:**
1. Frontend receives clientSecret
2. Initialize Stripe Elements
3. Create payment method
4. Confirm payment with clientSecret
5. Stripe calls webhook on success
6. Backend records payment automatically

### 4. Stripe Webhook
```
POST /api/payments/stripe/webhook
(No authentication - signature verified)

Headers:
Stripe-Signature: {timestamp}.{signature}
```

**Handles:**
- Payment intent succeeded
- Subscription activated
- Renewal date set

### 5. Get Payment History
```
GET /api/payments/history?page=1&limit=20&status=completed
Authentication: Required
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 20)
- `status` - Filter by status: completed, failed, pending, refunded

**Response:** Same as billing-history endpoint

### 6. Get Invoice Details
```
GET /api/payments/invoice/:paymentId
Authentication: Required
```

**Response:**
```json
{
  "invoiceNumber": "INV-123-1705324200000",
  "date": "2024-01-15T10:30:00Z",
  "dueDate": "2024-01-15T10:30:00Z",
  "shop": {
    "name": "My Shop",
    "email": "shop@example.com",
    "phone": "+91-9999999999"
  },
  "plan": {
    "id": 2,
    "name": "Basic",
    "monthlyPrice": 299
  },
  "amount": 299,
  "billingCycle": "monthly",
  "paymentMethod": "card",
  "transactionId": "pi_1234567890",
  "status": "completed"
}
```

### 7. Download Invoice PDF
```
GET /api/payments/invoice/:paymentId/download
Authentication: Required
```

**Response:**
```json
{
  "message": "Invoice download link",
  "invoiceUrl": "/invoices/123.pdf",
  "filename": "invoice-123.pdf"
}
```

---

## Admin Authentication

**Base Path:** `/api/admin/auth`

### 1. Admin Login
```
POST /api/admin/auth/login

Body:
{
  "email": "admin@platform.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "fullName": "Admin User",
    "email": "admin@platform.com",
    "role": "super_admin"
  }
}
```

**Error Handling:**
- 5 failed attempts → account locked for 15 minutes
- Account locked error: 423

### 2. Get Admin Profile
```
GET /api/admin/auth/profile
Authentication: Required (Admin)
```

**Response:**
```json
{
  "id": 1,
  "fullName": "Admin User",
  "email": "admin@platform.com",
  "phone": "+91-9999999999",
  "role": "super_admin",
  "permissions": ["*"],
  "loginAttempts": 0,
  "lastLogin": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 3. Admin Logout
```
POST /api/admin/auth/logout
Authentication: Required (Admin)
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## Admin Panel

**Base Path:** `/api/admin`  
**Authentication:** Required + Super Admin role

### Shop Management

#### 1. List All Shops
```
GET /api/admin/shops?page=1&limit=50&status=active&kycStatus=approved&isBlocked=false
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 50)
- `status` - Filter by: active, inactive
- `kycStatus` - Filter by: pending, approved, rejected, needs_revision
- `isBlocked` - Filter by: true, false

**Response:**
```json
{
  "data": [
    {
      "id": 10,
      "name": "My Shop",
      "email": "shop@example.com",
      "phone": "+91-9999999999",
      "status": "active",
      "kycStatus": "approved",
      "isBlocked": false,
      "isVerified": true,
      "ownerId": 5,
      "owner": {
        "id": 5,
        "fullName": "Shop Owner",
        "email": "owner@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "totalPages": 3
  }
}
```

#### 2. Approve Shop
```
PATCH /api/admin/shops/:shopId/approve
```

**Response:**
```json
{
  "message": "Shop approved successfully",
  "shop": { /* Updated shop object */ }
}
```

**Actions:**
- Sets `isVerified: true`
- Sets `kycStatus: approved`
- Creates admin log entry

#### 3. Block Shop
```
PATCH /api/admin/shops/:shopId/block

Body:
{
  "blockReason": "Selling counterfeit products"
}
```

**Response:**
```json
{
  "message": "Shop blocked successfully",
  "shop": { /* Updated shop object */ }
}
```

**Actions:**
- Sets `isBlocked: true`
- Sets `isActive: false` (disables shop)
- Records block reason
- Sets blockedAt timestamp

#### 4. Unblock Shop
```
PATCH /api/admin/shops/:shopId/unblock
```

**Response:**
```json
{
  "message": "Shop unblocked successfully",
  "shop": { /* Updated shop object */ }
}
```

**Actions:**
- Sets `isBlocked: false`
- Sets `isActive: true` (re-enables shop)
- Clears block reason

### Subscription Management

#### 1. List All Subscriptions
```
GET /api/admin/subscriptions?page=1&limit=50&status=active&planId=2
```

**Query Parameters:**
- `page` - Page number
- `limit` - Records per page
- `status` - Filter by: active, inactive, suspended, cancelled
- `planId` - Filter by plan

**Response:**
```json
{
  "data": [
    {
      "id": 5,
      "shopId": 10,
      "planId": 2,
      "billingCycle": "monthly",
      "startDate": "2024-01-15T10:30:00Z",
      "renewalDate": "2024-02-15T10:30:00Z",
      "status": "active",
      "isPaymentPending": false,
      "shop": {
        "id": 10,
        "name": "My Shop",
        "email": "shop@example.com"
      },
      "plan": {
        "id": 2,
        "name": "Basic",
        "monthlyPrice": 299
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

#### 2. Suspend Subscription
```
PATCH /api/admin/subscriptions/:subId/suspend

Body:
{
  "reason": "Non-payment"
}
```

**Response:**
```json
{
  "message": "Subscription suspended successfully",
  "subscription": { /* Updated subscription */ }
}
```

**Actions:**
- Sets subscription `status: suspended`
- Disables associated shop (`isActive: false`)
- Creates admin log entry
- Blocks shop with reason

#### 3. Resume Subscription
```
PATCH /api/admin/subscriptions/:subId/resume
```

**Response:**
```json
{
  "message": "Subscription resumed successfully",
  "subscription": { /* Updated subscription */ }
}
```

**Actions:**
- Sets subscription `status: active`
- Re-enables shop (`isActive: true`)
- Clears block status
- Creates admin log entry

### KYC Verification

#### 1. List Pending KYC Verifications
```
GET /api/admin/kyc/pending?page=1&limit=50
```

**Response:**
```json
{
  "data": [
    {
      "id": 3,
      "shopId": 15,
      "status": "pending",
      "gstCertificate": "https://s3.../gst.pdf",
      "panCard": "https://s3.../pan.jpg",
      "aadhaarCard": "https://s3.../aadhaar.jpg",
      "businessLicense": "https://s3.../license.pdf",
      "bankAccountProof": "https://s3.../bank.pdf",
      "ownerIdProof": "https://s3.../id.jpg",
      "createdAt": "2024-01-10T15:00:00Z",
      "shop": {
        "id": 15,
        "name": "Another Shop"
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

#### 2. Approve KYC
```
PATCH /api/admin/kyc/:kycId/approve
```

**Response:**
```json
{
  "message": "KYC approved successfully",
  "kyc": {
    "id": 3,
    "status": "approved",
    "verifiedBy": 1,
    "verifiedAt": "2024-01-15T10:30:00Z",
    "expiryDate": "2025-01-15T10:30:00Z"
  }
}
```

**Actions:**
- Sets `status: approved`
- Sets `expiryDate: 1 year from now`
- Records `verifiedBy: admin_id`
- Updates shop `kycStatus: approved`
- Creates admin log entry

#### 3. Reject KYC
```
PATCH /api/admin/kyc/:kycId/reject

Body:
{
  "rejectionReason": "Documents not clear, please resubmit"
}
```

**Response:**
```json
{
  "message": "KYC rejected successfully",
  "kyc": {
    "id": 3,
    "status": "rejected",
    "rejectionReason": "Documents not clear, please resubmit"
  }
}
```

**Actions:**
- Sets `status: rejected`
- Records rejection reason
- Updates shop `kycStatus: rejected`
- Creates admin log entry

### Abuse Management

#### 1. List Abuse Reports
```
GET /api/admin/abuse-reports?page=1&limit=50&status=open&severity=high
```

**Query Parameters:**
- `page` - Page number
- `limit` - Records per page
- `status` - Filter by: open, resolved
- `severity` - Filter by: low, medium, high, critical

**Response:**
```json
{
  "data": [
    {
      "id": 8,
      "shopId": 12,
      "reportType": "fraud",
      "severity": "critical",
      "description": "Selling counterfeit products with fake reviews",
      "evidence": ["https://s3.../photo1.jpg", "https://s3.../photo2.jpg"],
      "status": "open",
      "createdAt": "2024-01-14T09:00:00Z",
      "shop": {
        "id": 12,
        "name": "Suspicious Shop"
      },
      "reporter": {
        "id": 20,
        "fullName": "Reporter User"
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

#### 2. Resolve Abuse Report
```
PATCH /api/admin/abuse-reports/:reportId/resolve

Body:
{
  "actionTaken": "suspension",
  "investigationNotes": "Confirmed selling counterfeit products. Suspending shop for 30 days."
}
```

**Query Parameters:**
- `actionTaken` - Options: warning, suspension, permanent_ban, none

**Response:**
```json
{
  "message": "Abuse report resolved successfully",
  "report": {
    "id": 8,
    "status": "resolved",
    "actionTaken": "suspension",
    "investigatedBy": 1,
    "resolvedAt": "2024-01-15T10:30:00Z",
    "investigationNotes": "Confirmed selling counterfeit products..."
  }
}
```

**Actions Based on actionTaken:**
- **warning** - Sends warning to shop owner
- **suspension** - Blocks shop with abuse reason (isActive: false)
- **permanent_ban** - Blocks and disables shop permanently
- **none** - Closes report without action

### Analytics Dashboard

#### 1. Platform Dashboard
```
GET /api/admin/analytics/dashboard
```

**Response:**
```json
{
  "summary": {
    "totalShops": 1250,
    "activeShops": 1100,
    "blockedShops": 150,
    "totalSubscriptions": 1050,
    "activeSubscriptions": 1020,
    "suspendedSubscriptions": 30,
    "pendingKYC": 45,
    "approvedKYC": 1150,
    "openAbuseReports": 8,
    "resolvedAbuseReports": 42
  },
  "revenue": {
    "lastMonth": 125000,
    "last3Months": 350000,
    "last6Months": 700000,
    "lastYear": 1400000
  },
  "subscriptionBreakdown": {
    "free": 200,
    "basic": 650,
    "pro": 200
  },
  "billingCycles": {
    "monthly": 750,
    "yearly": 300
  },
  "chartData": {
    "dailyRevenue": [
      { "date": "2024-01-15", "amount": 4200 },
      { "date": "2024-01-14", "amount": 3800 }
    ],
    "shopsPerDay": [
      { "date": "2024-01-15", "count": 12 }
    ]
  }
}
```

### Admin Logs

#### 1. Get Admin Action Logs
```
GET /api/admin/logs?page=1&limit=50&adminId=1&action=shop_blocked
```

**Query Parameters:**
- `page` - Page number
- `limit` - Records per page
- `adminId` - Filter by admin
- `action` - Filter by action type

**Response:**
```json
{
  "data": [
    {
      "id": 100,
      "adminId": 1,
      "action": "shop_blocked",
      "entityType": "shop",
      "entityId": 12,
      "changes": {
        "isBlocked": true,
        "blockReason": "Selling counterfeit products"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00Z",
      "admin": {
        "id": 1,
        "fullName": "Admin User"
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

**Available Actions:**
- shop_approved
- shop_blocked
- shop_unblocked
- kyc_verified
- kyc_rejected
- abuse_resolved
- subscription_changed
- subscription_suspended
- subscription_resumed
- payment_recorded
- features_updated

---

## Feature Limits

### Usage Limiter Middleware

Applied to routes that create/update resources based on plan limits.

### Limit Enforcement

**Products Per Shop:**
- Free: 50
- Basic: 500
- Pro: 5000

**Monthly Orders:**
- Free: 100
- Basic: 1000
- Pro: 10000

**Employees Per Shop:**
- Free: 3
- Basic: 10
- Pro: 50

**Features by Plan:**

| Feature | Free | Basic | Pro |
|---------|------|-------|-----|
| Multiple Shops | ❌ | ✅ (2) | ✅ (5) |
| Advanced Analytics | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Custom Domain | ❌ | ❌ | ✅ |
| Multiple Locations | ❌ | ❌ | ✅ |
| Payment Gateway | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

### Usage Check Response

When limit exceeded:
```json
{
  "success": false,
  "message": "Product limit reached (500). Upgrade your plan to add more products.",
  "errorCode": "USAGE_LIMIT_EXCEEDED"
}
```

Status Code: `429 Too Many Requests`

---

## Auto-Disable on Non-Payment

### Workflow

1. **Payment Due** - `nextPaymentDate` reached
2. **Grace Period** - 7 days to make payment
3. **Auto-Disable** - After 7 days, shop automatically disabled
4. **Notification** - Email sent to shop owner
5. **Re-enable** - Shop automatically re-enabled on payment

### Cron Job Endpoint

```
POST /api/subscriptions/check-payment-status

Headers:
X-API-Key: {CRON_SECRET_KEY}
```

**Should be called daily by external cron service:**
```bash
0 2 * * * curl -X POST http://localhost:5000/api/subscriptions/check-payment-status -H "X-API-Key: secret"
```

**Response:**
```json
{
  "message": "5 subscriptions disabled due to non-payment"
}
```

---

## Error Handling

### Common Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `402` - Payment Required (subscription inactive)
- `403` - Forbidden (feature not available)
- `404` - Not Found
- `423` - Locked (admin account locked after failed attempts)
- `429` - Too Many Requests (limit exceeded)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

---

## Environment Variables Required

```
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=apna_vyapar
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Cron Job
CRON_SECRET_KEY=your_cron_secret

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Environment
NODE_ENV=production
PORT=5000
```

---

## Testing Credentials

### Super Admin
```
Email: admin@platform.com
Password: Admin@123456
```

### Test Shop Owner
```
Email: owner@testshop.com
Password: Owner@123456
```

---

## Rate Limiting & Security

- Admin login: 5 attempts per IP per hour
- API requests: Standard rate limiting applied
- All passwords: bcryptjs hashing with salt rounds: 10
- JWT tokens: Expire after 7 days
- Admin logout: Requires valid token

---

## Next Steps for Developers

1. **Setup Payment Gateways**
   - Integrate Razorpay/Stripe SDKs
   - Add webhook handling
   - Implement invoice generation

2. **Email Notifications**
   - Payment receipts
   - Renewal reminders
   - Upgrade suggestions
   - Payment failure warnings

3. **Frontend Integration**
   - Subscription selection UI
   - Billing page
   - Admin dashboard
   - KYC upload forms

4. **Monitoring**
   - Track failed payments
   - Monitor subscription churn
   - Analytics on plan adoption

5. **Testing**
   - Unit tests for models
   - Integration tests for workflows
   - Payment simulation testing

---

## Support

For issues or questions, contact the development team.
