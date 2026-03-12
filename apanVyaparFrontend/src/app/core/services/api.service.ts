import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Product, 
  ProductCategory, 
  Customer, 
  Employee, 
  Order, 
  Shop, 
  AccountingEntry, 
  Payroll,
  InventoryItem,
  InventoryTransaction,
  InventorySummary,
  Notification,
  Payment,
  ApiResponse,
  PaginatedResponse,
  FieldConfiguration,
  ReferralCode,
  CatalogAccess,
  LoyaltyPoints,
  LoyaltyTransaction
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  // ============ AUTH ============
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  // ============ SHOPS ============
  getShops(): Observable<ApiResponse<Shop[]>> {
    return this.http.get<ApiResponse<Shop[]>>(`${this.baseUrl}/shops`);
  }

  getShop(shopId: string): Observable<ApiResponse<Shop>> {
    return this.http.get<ApiResponse<Shop>>(`${this.baseUrl}/shops/${shopId}`);
  }

  createShop(shopData: any): Observable<ApiResponse<Shop>> {
    return this.http.post<ApiResponse<Shop>>(`${this.baseUrl}/shops`, shopData);
  }

  updateShop(shopId: string, shopData: any): Observable<ApiResponse<Shop>> {
    return this.http.put<ApiResponse<Shop>>(`${this.baseUrl}/shops/${shopId}`, shopData);
  }

  deleteShop(shopId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/shops/${shopId}`);
  }

  // ============ PRODUCTS ============
  getProducts(
    shopId: string, 
    categoryId?: string, 
    search?: string, 
    page: number = 1, 
    pageSize: number = 10,
    isFeatured?: boolean
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (categoryId) params = params.set('categoryId', categoryId);
    if (search) params = params.set('search', search);
    if (isFeatured !== undefined) params = params.set('isFeatured', isFeatured.toString());

    return this.http.get<PaginatedResponse<Product>>(`${this.baseUrl}/products/${shopId}`, { params });
  }

  getProduct(productId: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/${productId}`);
  }

  createProduct(shopId: string, productData: any): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/products/${shopId}`, productData);
  }

  updateProduct(productId: string, productData: any): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/products/${productId}`, productData);
  }

  deleteProduct(productId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/products/${productId}`);
  }

  // ============ CATEGORIES ============
  getCategories(shopId: string): Observable<ApiResponse<ProductCategory[]>> {
    return this.http.get<ApiResponse<ProductCategory[]>>(`${this.baseUrl}/categories/${shopId}`);
  }

  getCategory(categoryId: string, shopId?: string): Observable<ApiResponse<ProductCategory>> {
    const url = shopId ? `${this.baseUrl}/categories/${categoryId}/${shopId}` : `${this.baseUrl}/categories/${categoryId}`;
    return this.http.get<ApiResponse<ProductCategory>>(url);
  }

  createCategory(shopId: string, categoryData: any): Observable<ApiResponse<ProductCategory>> {
    return this.http.post<ApiResponse<ProductCategory>>(`${this.baseUrl}/categories/${shopId}`, categoryData);
  }

  updateCategory(categoryId: string, categoryData: any, shopId?: string): Observable<ApiResponse<ProductCategory>> {
    const url = shopId ? `${this.baseUrl}/categories/${categoryId}/${shopId}` : `${this.baseUrl}/categories/${categoryId}`;
    return this.http.put<ApiResponse<ProductCategory>>(url, categoryData);
  }

  deleteCategory(categoryId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/categories/${categoryId}`);
  }

  // ============ CUSTOMERS ============
  getShopCustomers(shopId: string, customerType?: string): Observable<ApiResponse<Customer[]>> {
    let params = new HttpParams();
    if (customerType) params = params.set('customerType', customerType);
    return this.http.get<ApiResponse<Customer[]>>(`${this.baseUrl}/customers/${shopId}`, { params });
  }

  getCustomer(customerId: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.baseUrl}/customers/${customerId}`);
  }

  addCustomer(shopId: string, customerData: any): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.baseUrl}/customers/${shopId}`, customerData);
  }

  updateCustomer(customerId: string, customerData: any): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.baseUrl}/customers/${customerId}`, customerData);
  }

  deleteCustomer(customerId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/customers/${customerId}`);
  }

  // ============ EMPLOYEES ============
  getEmployees(shopId?: string, page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Employee>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (shopId) params = params.set('shopId', shopId);
    return this.http.get<PaginatedResponse<Employee>>(`${this.baseUrl}/employees`, { params });
  }

  getEmployee(employeeId: string): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.baseUrl}/employees/${employeeId}`);
  }

  createEmployee(shopId: string, employeeData: any): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.baseUrl}/employees/${shopId}`, employeeData);
  }

  updateEmployee(employeeId: string, employeeData: any): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.baseUrl}/employees/${employeeId}`, employeeData);
  }

  deleteEmployee(employeeId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/employees/${employeeId}`);
  }

  // Employee Field Configuration
  getEmployeeFieldConfiguration(shopId: string): Observable<ApiResponse<FieldConfiguration>> {
    return this.http.get<ApiResponse<FieldConfiguration>>(`${this.baseUrl}/configuration/employee-fields/${shopId}`);
  }

  configureEmployeeFields(shopId: string, fields: any[]): Observable<ApiResponse<FieldConfiguration>> {
    return this.http.post<ApiResponse<FieldConfiguration>>(`${this.baseUrl}/configuration/employee-fields/${shopId}`, { fields });
  }

  // Product Field Configuration
  getProductFieldConfiguration(shopId: string): Observable<ApiResponse<FieldConfiguration>> {
    return this.http.get<ApiResponse<FieldConfiguration>>(`${this.baseUrl}/configuration/product-fields/${shopId}`);
  }

  configureProductFields(shopId: string, fields: any[]): Observable<ApiResponse<FieldConfiguration>> {
    return this.http.post<ApiResponse<FieldConfiguration>>(`${this.baseUrl}/configuration/product-fields/${shopId}`, { fields });
  }

  // Shop Field Configuration
  getShopFieldConfiguration(shopId: string): Observable<ApiResponse<FieldConfiguration>> {
    return this.http.get<ApiResponse<FieldConfiguration>>(`${this.baseUrl}/configuration/shop-fields/${shopId}`);
  }

  configureShopFields(shopId: string, fields: any[]): Observable<ApiResponse<FieldConfiguration>> {
    return this.http.post<ApiResponse<FieldConfiguration>>(`${this.baseUrl}/configuration/shop-fields/${shopId}`, { fields });
  }

  // Public View Configuration
  getPublicViewStatus(shopId: string): Observable<ApiResponse<{ publicView: boolean }>> {
    return this.http.get<ApiResponse<{ publicView: boolean }>>(`${this.baseUrl}/shops/${shopId}/public-view`);
  }

  enablePublicView(shopId: string): Observable<ApiResponse<{ publicView: boolean }>> {
    return this.http.post<ApiResponse<{ publicView: boolean }>>(`${this.baseUrl}/shops/${shopId}/public-view/enable`, {});
  }

  disablePublicView(shopId: string): Observable<ApiResponse<{ publicView: boolean }>> {
    return this.http.post<ApiResponse<{ publicView: boolean }>>(`${this.baseUrl}/shops/${shopId}/public-view/disable`, {});
  }

  // ============ ORDERS ============
  getShopOrders(shopId: string): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(`${this.baseUrl}/orders/${shopId}`);
  }

  getOrder(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/orders/order/${orderId}`);
  }

  createOrder(shopId: string, orderData: any): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/orders/${shopId}`, orderData);
  }

  updateOrder(orderId: string, orderData: any): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.baseUrl}/orders/order/${orderId}`, orderData);
  }

  deleteOrder(orderId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/orders/order/${orderId}`);
  }

  // ============ INVENTORY ============
  getInventory(shopId: string): Observable<ApiResponse<InventoryItem[]>> {
    return this.http.get<ApiResponse<InventoryItem[]>>(`${this.baseUrl}/inventory/${shopId}`);
  }

  updateInventory(productId: string, quantity: number): Observable<ApiResponse<InventoryItem>> {
    return this.http.put<ApiResponse<InventoryItem>>(`${this.baseUrl}/inventory/${productId}`, { quantity });
  }

  // Inventory Summary
  getInventorySummary(shopId: string): Observable<ApiResponse<InventorySummary>> {
    return this.http.get<ApiResponse<InventorySummary>>(`${this.baseUrl}/inventory/${shopId}/summary`);
  }

  // Inventory Transactions
  getShopInventoryTransactions(shopId: string): Observable<ApiResponse<InventoryTransaction[]>> {
    return this.http.get<ApiResponse<InventoryTransaction[]>>(`${this.baseUrl}/inventory/${shopId}/transactions`);
  }

  createInventoryTransaction(shopId: string, data: any): Observable<ApiResponse<InventoryTransaction>> {
    return this.http.post<ApiResponse<InventoryTransaction>>(`${this.baseUrl}/inventory/${shopId}/transactions`, data);
  }

  // Low Stock Products
  getLowStockProducts(shopId: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.baseUrl}/inventory/${shopId}/low-stock`);
  }

  // ============ PAYMENTS ============
  getPayments(shopId: string): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.baseUrl}/payments/${shopId}`);
  }

  getPayment(paymentId: string): Observable<ApiResponse<Payment>> {
    return this.http.get<ApiResponse<Payment>>(`${this.baseUrl}/payments/${paymentId}`);
  }

  // ============ ACCOUNTING ============
  getAccountingEntries(shopId: string, startDate?: string, endDate?: string): Observable<ApiResponse<AccountingEntry[]>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<AccountingEntry[]>>(`${this.baseUrl}/accounting/${shopId}`, { params });
  }

  getAccountingDashboard(shopId: string, days: number = 30): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/accounting/${shopId}/dashboard`, { 
      params: new HttpParams().set('days', days.toString()) 
    });
  }

  createAccountingEntry(shopId: string, entryData: any): Observable<ApiResponse<AccountingEntry>> {
    return this.http.post<ApiResponse<AccountingEntry>>(`${this.baseUrl}/accounting/${shopId}`, entryData);
  }

  updateAccountingEntry(entryId: string, entryData: any): Observable<ApiResponse<AccountingEntry>> {
    return this.http.put<ApiResponse<AccountingEntry>>(`${this.baseUrl}/accounting/${entryId}`, entryData);
  }

  deleteAccountingEntry(entryId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/accounting/${entryId}`);
  }

  // ============ PAYROLL ============
  getPayrollList(shopId: string): Observable<ApiResponse<Payroll[]>> {
    return this.http.get<ApiResponse<Payroll[]>>(`${this.baseUrl}/payroll/${shopId}`);
  }

  getPayrolls(
    shopId: string,
    employeeId?: string,
    month?: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<PaginatedResponse<Payroll>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (employeeId) params = params.set('employeeId', employeeId);
    if (month) params = params.set('month', month);

    return this.http.get<PaginatedResponse<Payroll>>(`${this.baseUrl}/payroll/${shopId}`, { params });
  }

  getPayroll(payrollId: string): Observable<ApiResponse<Payroll>> {
    return this.http.get<ApiResponse<Payroll>>(`${this.baseUrl}/payroll/${payrollId}`);
  }

  createPayroll(shopId: string, payrollData: any): Observable<ApiResponse<Payroll>> {
    return this.http.post<ApiResponse<Payroll>>(`${this.baseUrl}/payroll/${shopId}`, payrollData);
  }

  updatePayroll(payrollId: string, payrollData: any): Observable<ApiResponse<Payroll>> {
    return this.http.put<ApiResponse<Payroll>>(`${this.baseUrl}/payroll/${payrollId}`, payrollData);
  }

  deletePayroll(payrollId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/payroll/${payrollId}`);
  }

  updatePayrollPaymentStatus(payrollId: string, paymentData: any): Observable<ApiResponse<Payroll>> {
    return this.http.put<ApiResponse<Payroll>>(`${this.baseUrl}/payroll/${payrollId}/payment-status`, paymentData);
  }

  // ============ NOTIFICATIONS ============
  getNotifications(): Observable<ApiResponse<Notification[]>> {
    return this.http.get<ApiResponse<Notification[]>>(`${this.baseUrl}/notifications`);
  }

  markNotificationRead(notificationId: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/notifications/${notificationId}/read`, {});
  }

  markAllNotificationsRead(): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/notifications/read-all`, {});
  }

  deleteNotification(notificationId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/notifications/${notificationId}`);
  }

  // ============ PUBLIC CATALOG ============
  getPublicCatalog(shopId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/public-catalog/${shopId}`);
  }

  getShopByReferralCode(referralCode: string): Observable<ApiResponse<Shop>> {
    return this.http.get<ApiResponse<Shop>>(`${this.baseUrl}/public-catalog/referral/${referralCode}`);
  }

  trackCatalogAccess(shopId: string, referralCode: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/public-catalog/track`, { shopId, referralCode });
  }

  // ============ CLIENT/PROFILE ============
  getMyProfile(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/client/profile`);
  }

  updateMyProfile(profileData: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/client/profile`, profileData);
  }

  getMyOrders(page: number = 1, pageSize: number = 10, status?: string): Observable<PaginatedResponse<Order>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedResponse<Order>>(`${this.baseUrl}/client/orders`, { params });
  }

  getMyOrder(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/client/orders/${orderId}`);
  }

  getMyLoyaltyPoints(): Observable<ApiResponse<LoyaltyPoints>> {
    return this.http.get<ApiResponse<LoyaltyPoints>>(`${this.baseUrl}/client/loyalty`);
  }

  getMyLoyaltyHistory(): Observable<ApiResponse<LoyaltyTransaction[]>> {
    return this.http.get<ApiResponse<LoyaltyTransaction[]>>(`${this.baseUrl}/client/loyalty/history`);
  }

  // ============ CATALOG ACCESS ============
  getMyCatalogAccess(): Observable<ApiResponse<CatalogAccess[]>> {
    return this.http.get<ApiResponse<CatalogAccess[]>>(`${this.baseUrl}/client/catalogs`);
  }

  requestCatalogAccess(code: string): Observable<ApiResponse<CatalogAccess>> {
    return this.http.post<ApiResponse<CatalogAccess>>(`${this.baseUrl}/client/catalogs/request`, { code });
  }

  // ============ ANALYTICS ============
  getEmployeeStats(shopId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/analytics/employee/${shopId}`);
  }

  getDashboardStats(shopId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/analytics/dashboard/${shopId}`);
  }

  getRevenueChart(shopId: string, days: number = 30): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/analytics/revenue/${shopId}`, {
      params: new HttpParams().set('days', days.toString())
    });
  }

  getTopProducts(shopId: string, limit: number = 5): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/analytics/top-products/${shopId}`, {
      params: new HttpParams().set('limit', limit.toString())
    });
  }

  getTopCustomers(shopId: string, limit: number = 5): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/analytics/top-customers/${shopId}`, {
      params: new HttpParams().set('limit', limit.toString())
    });
  }
}

