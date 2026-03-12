// User and Auth Models
export interface User {
  id?: string;
  userId?: string;
  email: string;
  fullName: string;
  role: string;
  userType: 'SHOP_OWNER' | 'EMPLOYEE' | 'CUSTOMER' | 'ADMIN';
  phoneNumber?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  shopId: string;
  shopName: string;
  shopDescription?: string;
  shopCategory?: string;
  shopType?: string;
  shopLogo?: string;
  shopBanner?: string;
  phoneNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  isActive: boolean;
  isPublic?: boolean;
  publicView?: boolean;
  ownerId: string;
  // Stats - added to fix template errors
  totalProducts?: number;
  totalOrders?: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShopRequest {
  shopName: string;
  shopDescription?: string;
  shopCategory?: string;
  shopType?: string;
  shopLogo?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Product Models
export interface Product {
  productId?: string;
  id?: string;
  productName: string;
  productCode?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  manufacturer?: string;
  costPrice?: number;
  mrp?: number;
  sellingPrice?: number;
  retailPrice?: number;
  wholesalePrice?: number;
  unit?: string;
  discountPercentage?: number;
  taxPercentage?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  weight?: number;
  dimensions?: string;
  imageUrl?: string;
  images?: string[];
  galleryImages?: string[];
  tags?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  expiryDate?: string;
  batchNumber?: string;
  warrantyMonths?: number;
  returnDays?: number;
  shopId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  categoryId?: string;
  categoryName: string;
  categoryDescription?: string;
  description?: string;
  sortOrder?: number;
  parentCategoryId?: string;
  categoryImage?: string;
  isActive?: boolean;
  shopId: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  success?: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    orders?: T[]; // For backward compatibility
  };
  message?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// Customer Models
export interface Customer {
  customerId?: string;
  id?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerType?: 'RETAIL' | 'WHOLESALE';
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  totalOrders?: number;
  totalSpent?: number;
  shopId: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Additional properties used in components
  fullName?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  pincode?: string;
  creditLimit?: number;
}

// Shop Customer - used in order form for customer selection
export interface ShopCustomer {
  id?: string;
  customerId?: string;
  fullName: string;
  customerName?: string;
  name?: string;
  phone: string;
  customerPhone?: string;
  email?: string;
  customerEmail?: string;
  customerType?: 'RETAIL' | 'WHOLESALE';
  shopId: string;
  companyName?: string;
  totalPurchases?: number;
  loyaltyPoints?: number;
  isBlacklisted?: boolean;
  isActive?: boolean;
}

// Employee Models
export interface Employee {
  employeeId?: string;
  id?: string;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phone?: string;
  designation?: string;
  department?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  employeeType?: string;
  salary?: number;
  joiningDate?: string;
  probationEndDate?: string;
  reportingTo?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankAccount?: string;
  bankIfsc?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  address?: string;
  photoUrl?: string;
  shopId: string;
  isActive?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Order Models
export interface Order {
  orderId: string;
  orderNumber?: string;
  orderType?: 'ONLINE' | 'OFFLINE' | 'RETAIL' | 'WHOLESALE';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerId?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL' | 'UNPAID' | 'PARTIALLY_PAID';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'COD';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'DRAFT' | 'COMPLETED';
  notes?: string;
  customerNotes?: string;
  internalNotes?: string;
  shopId: string;
  createdBy?: string;
  orderDate: string;
  deliveredDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  itemId?: string;
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  tax?: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: string;
  oldStatus?: string;
  newStatus?: string;
  type?: 'ORDER_STATUS' | 'PAYMENT_STATUS';
  notes?: string;
  reason?: string;
  changedBy?: string;
  createdAt: string;
}

// Referral Models
export interface ReferralCode {
  referralId?: string;
  id?: string;
  code: string;
  referralCode: string;            // always provided by backend
  name: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
  selectionType: 'products' | 'categories'; // required for forms
  selectedProducts?: string[];
  selectedCategories?: string[];
  shopId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Accounting Models
export interface AccountingEntry {
  id?: string;
  entryId?: string;
  accountingId?: string;  // Alias for backward compatibility
  entryType: 'INCOME' | 'EXPENSE';
  /**
   * The backend actually uses `transactionType`, so expose it as an optional
   * alias to keep existing templates/components working without a refactor.
   */
  transactionType?: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description?: string;
  /**
   * Backend field is `paymentMode`; `paymentMethod` was previously used in
   * older code. Both are provided here for compatibility.
   */
  paymentMethod?: 'CASH' | 'BANK' | 'CARD' | 'UPI';
  paymentMode?: 'CASH' | 'BANK' | 'CARD' | 'UPI';
  referenceNumber?: string;
  entryDate: string;
  transactionDate?: string;
  shopId: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Alias for backward compatibility
export type Accounting = AccountingEntry;

// Payroll Models
export interface Payroll {
  payrollId?: string;
  id?: string;
  employeeId: string;
  employeeName?: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  netSalary: number;
  paymentDate?: string;
  paymentStatus?: 'PENDING' | 'PAID';
  notes?: string;
  shopId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Inventory Models
export interface InventoryItem {
  id?: string;
  productId: string;
  productName?: string;
  productCode?: string;
  currentStock: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  lastRestockedDate?: string;
  shopId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryTransaction {
  id?: string;
  transactionId?: string;
  productId: string;
  productName?: string;
  transactionType: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE';
  quantityChange: number;
  unitCost?: number;
  totalCost?: number;
  remarks?: string;
  transactionDate: string;
  shopId: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Stock levels for display
  previousStock?: number;
  newStock?: number;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockValue: number;
  totalRetailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overStockCount: number;
  recentTransactions: number;
}

// Notification Models
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  priority?: 'High' | 'Urgent' | 'Normal' | 'Low';
  notificationType?: 'Order' | 'Stock' | 'Payment' | 'System';
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

// Payment Models
export interface Payment {
  paymentId?: string;
  id?: string;
  orderId: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  customerId?: string;
  shopId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Loyalty Points Models
export interface LoyaltyPoints {
  id?: string;
  customerId: string;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  shopId: string;
  createdAt?: string;
  updatedAt?: string;
  // For client loyalty view
  transactions?: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  orderId?: string;
  points: number;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  description?: string;
  shopId: string;
  createdAt: string;
}

// Catalog Access Models
export interface CatalogAccess {
  id: string;
  customerId: string;
  shopId: string;
  shopName?: string;
  shop?: Shop;  // For displaying shop info
  referralCode?: string;
  accessLevel: 'VIEW' | 'ORDER';
  status: 'ACTIVE' | 'REVOKED';
  isActive?: boolean;
  grantedAt?: string;
  revokedAt?: string;
  accessedAt?: string;  // When the customer last accessed
  createdAt: string;
}

// Employee Field interface for form configuration
export interface EmployeeField {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
  required?: boolean;  // optional to align with FormFieldConfig
}

// Custom Form Field Configuration
export interface FormFieldConfig {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
  required?: boolean;
  options?: string[];
}

export interface FieldConfiguration {
  id?: string;
  shopId: string;
  entityType: 'employee' | 'product' | 'shop';
  fields: FormFieldConfig[] | string;
  createdAt?: string;
  updatedAt?: string;
}

// Analytics Models
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange?: number;
  ordersChange?: number;
  productsChange?: number;
  customersChange?: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
}

// Export type aliases for convenience
export type Category = ProductCategory;

// Create Customer Request interface
export interface CreateCustomerRequest {
  customerType: 'RETAIL' | 'WHOLESALE';
  fullName: string;
  phone: string;
  email?: string;
  companyName?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  creditLimit?: number;
  shopId?: string;
}

// Create Employee Request interface  
export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  employeeType?: string;
  salary?: number;
  joiningDate?: string | Date;
  probationEndDate?: string | Date;
  reportingTo?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankAccount?: string;
  bankIfsc?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  address?: string;
  shopId?: string;
  userId?: string;
}

// Create Product Request interface
export interface CreateProductRequest {
  productName: string;
  productCode?: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  manufacturer?: string;
  costPrice?: number;
  mrp?: number;
  sellingPrice?: number;
  retailPrice?: number;
  wholesalePrice?: number;
  unit?: string;
  discountPercentage?: number;
  taxPercentage?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  weight?: number;
  dimensions?: string;
  imageUrl?: string;
  images?: string[];
  galleryImages?: string[];
  tags?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  expiryDate?: string;
  batchNumber?: string;
  warrantyMonths?: number;
  returnDays?: number;
  shopId: string;
}

// Extended Payroll interface with all salary components
export interface PayrollDetails extends Payroll {
  salaryMonth?: string;
  hra?: number;
  medicalAllowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;
  overtimeAmount?: number;
  bonus?: number;
  pfDeduction?: number;
  taxDeduction?: number;
  loanDeduction?: number;
  otherDeductions?: number;
  workingDays?: number;
  leaveDays?: number;
  overtimeHours?: number;
  grossSalary?: number;
  paymentMode?: string;
  paymentReference?: string;
}

// Extended Product interface with additional fields
export interface ProductDetails extends Product {
  retailPrice?: number;
  wholesalePrice?: number;
  unit?: string;
  galleryImages?: string[];
  tags?: string[];
}

// Extended Shop interface with stats
export interface ShopDetails extends Shop {
  totalProducts?: number;
  totalOrders?: number;
  rating?: number;
}

// Extended ReferralCode interface
export interface ReferralCodeDetails extends ReferralCode {
  isActive?: boolean;
}

// Public Catalog Data interface
export interface PublicCatalogData {
  shop: Shop;
  products: Product[];
  categories: ProductCategory[];
}

// Additional missing interfaces
export interface CreateAccountingRequest {
  entryType: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description?: string;
  paymentMethod?: 'CASH' | 'BANK' | 'CARD' | 'UPI';
  referenceNumber?: string;
  entryDate: string;
  shopId: string;
}

export interface AccountingCategory {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface AccountingDashboard {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  recentTransactions: AccountingEntry[];
  incomeByCategory: { category: string; amount: number }[];
  expenseByCategory: { category: string; amount: number }[];
  // Dashboard period data
  currentPeriod?: {
    income: number;
    expense: number;
    net: number;
    incomeGrowth?: number;
    expenseGrowth?: number;
  };
  allTime?: {
    netBalance: number;
    totalIncome: number;
    totalExpense: number;
  };
}

export interface ShopWithStats extends Shop {
  totalProducts?: number;
  totalOrders?: number;
  totalCustomers?: number;
  totalRevenue?: number;
  rating?: number;
  gstNumber?: string;
}

// Catalog Access with Shop info
export interface CatalogAccessWithShop extends CatalogAccess {
  shop?: Shop;
}

