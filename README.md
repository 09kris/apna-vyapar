# 🏪 Apna Vyapar — Business Management System

**Apna Vyapar** (अपना व्यापार) is a full-stack business management web application built for Indian small and medium businesses. It covers everything a business owner needs — from managing products and inventory to tracking orders, employees, accounting, and customer loyalty — all in one place.

> *"Apna Vyapar" — Hindi for "My Business"*

---

## 🚀 Features

### 🛍️ Shop & Product Management
- Multi-shop support with shop profiles and settings
- Product catalog with stock quantity and reorder level tracking
- Category management for organized product listing
- Public catalog sharing with customers

### 📦 Inventory Management
- Real-time inventory tracking
- Inventory transaction history (previous stock vs new stock)
- Low stock alerts via reorder level

### 🛒 Orders Management
- Create and manage customer orders
- Order details and status tracking
- Order history and reporting

### 👥 Customer Management
- Retail and wholesale customer profiles
- Customer loyalty points system with transaction history
- Catalog access tracking per customer

### 💰 Accounting & Finance
- Income and expense tracking
- Accounting dashboard with current period and all-time summaries
- Income growth and expense growth reporting
- GST-ready accounting structure

### 👨‍💼 Employee & Payroll
- Employee profiles with employment type (FULL_TIME, PART_TIME, etc.)
- Payroll form and payroll list management
- Payroll status tracking (PENDING, PAID, etc.)

### 🔔 Notifications
- In-app notification system for business events

### 🎟️ Referral System
- Referral code generation and management
- Category-based referral tracking

### 🔐 Authentication
- Secure user registration and login
- Role-based access control

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Angular, TypeScript               |
| Styling    | HTML5, CSS3                       |
| Backend    | Node.js                           |
| API        | REST API                          |
| Language   | TypeScript (Frontend), JavaScript (Backend) |

---

## 📁 Project Structure

```
apna-vyapar/
├── apanVyaparFrontend/          # Angular frontend application
│   └── src/
│       └── app/
│           └── features/
│               ├── accounting/       # Income & expense management
│               ├── categories/       # Product categories
│               ├── customers/        # Customer profiles & loyalty
│               ├── employees/        # Employee management
│               ├── inventory/        # Stock tracking
│               ├── notifications/    # In-app notifications
│               ├── orders/           # Order management
│               ├── payroll/          # Payroll forms & lists
│               ├── products/         # Product catalog
│               ├── referral-codes/   # Referral system
│               └── shops/            # Shop management
├── backend/                     # Node.js REST API
├── TODO.md                      # Development progress tracker
├── FIX_PLAN.md                  # Bug fix tracking
└── .gitignore
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm
- Angular CLI

```bash
npm install -g @angular/cli
```

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/09kris/apna-vyapar.git
   cd apna-vyapar
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file inside `backend/`:
   ```env
   PORT=3000
   DB_URL=your_database_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```
   Backend runs at: `http://localhost:3000`

---

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd apanVyaparFrontend
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Configure the API URL**

   Update the API base URL in your environment file:
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api'
   };
   ```

4. **Start the development server**
   ```bash
   ng serve
   ```
   App runs at: `http://localhost:4200`

5. **Build for production**
   ```bash
   ng build --configuration production
   ```

---

## 🇮🇳 GST Support

Apna Vyapar is designed with Indian businesses in mind. The accounting and shop modules support GST number tracking, making it suitable for GST-registered businesses in India.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes
   ```bash
   git commit -m "Add: your feature description"
   ```
4. Push to your branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request

---

## 📄 License

This project is for educational purposes.

---

> Built by [Kris Heruwala](https://github.com/09kris)
