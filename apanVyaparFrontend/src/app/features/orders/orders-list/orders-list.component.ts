import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { OrderService, Order } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusHelperService, ORDER_STATUSES, OrderStatusConfig, PAYMENT_STATUSES, PaymentStatusConfig } from '../../../core/services/status-helper.service';

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="orders-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-left">
          <h1>Orders</h1>
          <span class="order-count">{{ totalOrders() }} orders</span>
        </div>
        <button class="btn-create" (click)="createOrder()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Order
        </button>
      </div>

      <!-- Filters Card -->
      <div class="filters-card">
        <div class="filters-row">
          <!-- Shop Selector -->
          <div class="filter-group shop-filter" *ngIf="isOwner() && availableShops().length > 1">
            <label>Shop</label>
            <select [(ngModel)]="selectedShopId" (change)="onShopChange()" class="form-select">
              <option *ngFor="let shop of availableShops()" [value]="shop.shopId">
                {{ shop.shopName }}
              </option>
            </select>
          </div>

          <!-- Search -->
          <div class="filter-group search-filter">
            <label>Search</label>
            <div class="search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text"
                [(ngModel)]="searchQuery"
                (keyup.enter)="applyFilters()"
                (input)="onSearchInput()"
                placeholder="Search order ID or customer..."
                class="form-input"
              />
              <button class="search-clear" *ngIf="searchQuery" (click)="clearSearch()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Order Status - Enhanced with all statuses -->
          <div class="filter-group status-filter">
            <label>Order Status</label>
            <select [(ngModel)]="statusFilter" (change)="applyFilters()" class="form-select status-select">
              <option value="">All Statuses</option>
              <option *ngFor="let status of orderStatuses" [value]="status.value">
                {{ status.icon }} {{ status.label }}
              </option>
            </select>
          </div>

          <!-- Payment Status - Enhanced with all statuses -->
          <div class="filter-group payment-filter">
            <label>Payment</label>
            <select [(ngModel)]="paymentStatusFilter" (change)="applyFilters()" class="form-select payment-select">
              <option value="">All Payments</option>
              <option *ngFor="let status of paymentStatuses" [value]="status.value">
                {{ status.icon }} {{ status.label }}
              </option>
            </select>
          </div>

          <!-- Date Range -->
          <div class="filter-group">
            <label>Date Range</label>
            <input 
              type="date" 
              [(ngModel)]="startDate" 
              (change)="applyFilters()"
              class="form-input"
              placeholder="From"
            />
          </div>

          <div class="filter-group">
            <label>&nbsp;</label>
            <input 
              type="date" 
              [(ngModel)]="endDate" 
              (change)="applyFilters()"
              class="form-input"
              placeholder="To"
            />
          </div>
        </div>

        <!-- Active Filters -->
        <div class="active-filters" *ngIf="hasActiveFilters()">
          <span class="filter-label">Active filters:</span>
          <span class="filter-tag" *ngIf="statusFilter">
            Status: {{ getStatusLabel(statusFilter) }}
            <button (click)="statusFilter = ''; applyFilters()">×</button>
          </span>
          <span class="filter-tag" *ngIf="paymentStatusFilter">
            Payment: {{ getPaymentLabel(paymentStatusFilter) }}
            <button (click)="paymentStatusFilter = ''; applyFilters()">×</button>
          </span>
          <span class="filter-tag" *ngIf="searchQuery">
            Search: {{ searchQuery }}
            <button (click)="clearSearch()">×</button>
          </span>
          <button class="clear-all" (click)="clearAllFilters()">Clear All</button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading orders...</p>
      </div>

      <!-- Error Message -->
      <div class="error-message" *ngIf="error()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {{ error() }}
        <button (click)="loadOrders()">Retry</button>
      </div>

      <!-- Orders Table -->
      <div class="orders-card" *ngIf="!loading()">
        <div class="table-responsive">
          <table class="orders-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sort('orderId')" [class.sorted]="sortConfig().column === 'orderId'">
                  Order ID
                  <span class="sort-icon" *ngIf="sortConfig().column === 'orderId'">
                    {{ sortConfig().direction === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th class="sortable" (click)="sort('customerName')" [class.sorted]="sortConfig().column === 'customerName'">
                  Customer
                  <span class="sort-icon" *ngIf="sortConfig().column === 'customerName'">
                    {{ sortConfig().direction === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th class="sortable" (click)="sort('totalAmount')" [class.sorted]="sortConfig().column === 'totalAmount'">
                  Amount
                  <span class="sort-icon" *ngIf="sortConfig().column === 'totalAmount'">
                    {{ sortConfig().direction === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th>Status</th>
                <th>Payment</th>
                <th class="sortable" (click)="sort('orderDate')" [class.sorted]="sortConfig().column === 'orderDate'">
                  Date
                  <span class="sort-icon" *ngIf="sortConfig().column === 'orderDate'">
                    {{ sortConfig().direction === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of paginatedOrders(); let i = index" 
                  class="order-row"
                  [class.delayed]="isOrderDelayed(order)">
                <td class="order-id-cell">
                  <span class="order-id">{{ order.orderId }}</span>
                  <span class="order-type" *ngIf="order.orderType">{{ order.orderType }}</span>
                </td>
                <td class="customer-cell">
                  <div class="customer-info">
                    <span class="customer-name">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      {{ order.customerName }}
                    </span>
                    <span class="customer-phone">{{ order.customerPhone }}</span>
                  </div>
                </td>
                <td class="amount-cell">
                  <span class="amount">₹{{ order.totalAmount | number:'1.2-2' }}</span>
                  <span class="items-count">{{ order.items.length || 0 }} items</span>
                </td>
                <td class="status-cell">
                  <!-- Enhanced Status Badge with Icon -->
                  <span class="status-badge" 
                        [ngClass]="'status-' + getStatusClass(order.orderStatus)"
                        [style.background-color]="getStatusBgColor(order.orderStatus)"
                        [style.color]="getStatusColor(order.orderStatus)">
                    <span class="status-icon" [innerHTML]="getStatusIcon(order.orderStatus)"></span>
                    {{ formatStatus(order.orderStatus) }}
                  </span>
                </td>
                <td class="payment-cell">
                  <!-- Enhanced Payment Badge with Icon -->
                  <span class="payment-badge" 
                        [ngClass]="'payment-' + getPaymentClass(order.paymentStatus)"
                        [style.background-color]="getPaymentBgColor(order.paymentStatus)"
                        [style.color]="getPaymentColor(order.paymentStatus)">
                    <span class="payment-icon">{{ getPaymentIcon(order.paymentStatus) }}</span>
                    {{ formatPayment(order.paymentStatus) }}
                  </span>
                </td>
                <td class="date-cell">
                  <span class="date">{{ order.orderDate | date:'mediumDate' }}</span>
                  <span class="time">{{ order.orderDate | date:'shortTime' }}</span>
                </td>
                <td class="actions-cell">
                  <div class="actions-wrapper">
                    <div class="actions-dropdown">
                      <button class="btn-action" (click)="viewOrder(order.orderId)" title="View">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button class="btn-action" (click)="editOrder(order.orderId)" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button class="btn-action" (click)="downloadInvoice(order.orderId)" title="Invoice">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                      </button>
                      <!-- Quick Status Dropdown -->
                      <div class="status-dropdown" *ngIf="canChangeStatus(order)">
                        <button class="btn-action btn-status" (click)="toggleStatusDropdown(order)" title="Change Status">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                        </button>
                        <div class="status-dropdown-menu" *ngIf="openStatusDropdown() === order.orderId">
                          <div class="dropdown-header">Change Status</div>
                          <button *ngFor="let status of orderStatuses" 
                                  class="dropdown-item"
                                  [class.active]="status.value === order.orderStatus"
                                  (click)="changeStatus(order, status.value)">
                            <span class="status-icon">{{ status.icon }}</span>
                            {{ status.label }}
                          </button>
                        </div>
                      </div>
                      <button class="btn-action btn-danger" (click)="deleteOrder(order)" title="Delete" *ngIf="canDelete(order)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="filteredOrders().length === 0 && !loading()">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <h3>No orders found</h3>
          <p>{{ searchQuery || statusFilter || paymentStatusFilter ? 'Try adjusting your filters' : 'Create your first order to get started' }}</p>
          <button class="btn-create" (click)="createOrder()" *ngIf="!searchQuery && !statusFilter && !paymentStatusFilter">
            Create Order
          </button>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages() > 1">
          <div class="pagination-info">
            Showing {{ startIndex() + 1 }}-{{ endIndex() }} of {{ totalOrders() }} orders
          </div>
          <div class="pagination-controls">
            <button class="btn-page" (click)="goToPage(1)" [disabled]="currentPage() === 1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </button>
            <button class="btn-page" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <button *ngFor="let page of visiblePages()" 
                    class="btn-page" 
                    [class.active]="page === currentPage()"
                    (click)="goToPage(page)">
              {{ page }}
            </button>
            
            <button class="btn-page" (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button class="btn-page" (click)="goToPage(totalPages())" [disabled]="currentPage() === totalPages()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </button>
          </div>
          <div class="page-size">
            <label>Per page:</label>
            <select [(ngModel)]="pageSize" (change)="onPageSizeChange()">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Container */
    .orders-container {
      padding: 24px;
      background: #f8fafc;
      min-height: calc(100vh - 60px);
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
    }

    .order-count {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }

    /* Create Button */
    .btn-create {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
    }

    .btn-create:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px -2px rgba(59, 130, 246, 0.4);
    }

    /* Filters Card */
    .filters-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .filters-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 150px;
    }

    .filter-group label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-group.shop-filter {
      min-width: 180px;
    }

    .filter-group.status-filter,
    .filter-group.payment-filter {
      min-width: 160px;
    }

    /* Enhanced filter dropdown styles */
    .status-select,
    .payment-select {
      padding: 10px 32px 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      color: #1e293b;
      background: white;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      transition: all 0.2s;
    }

    .status-select:hover,
    .payment-select:hover {
      border-color: #3b82f6;
    }

    .status-select:focus,
    .payment-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .status-select option,
    .payment-select option {
      padding: 8px;
    }

    .form-select, .form-input {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      color: #1e293b;
      background: white;
      transition: all 0.2s;
    }

    .form-select:focus, .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .shop-filter .form-select {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1d4ed8;
      font-weight: 500;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input-wrapper svg {
      position: absolute;
      left: 12px;
      color: #94a3b8;
    }

    .search-input-wrapper input {
      padding-left: 40px;
      padding-right: 36px;
    }

    .search-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      padding: 4px;
    }

    .search-clear:hover {
      color: #64748b;
    }

    /* Active Filters */
    .active-filters {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 13px;
      color: #64748b;
    }

    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #f1f5f9;
      border-radius: 20px;
      font-size: 13px;
      color: #475569;
    }

    .filter-tag button {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      font-size: 16px;
      line-height: 1;
      padding: 0;
    }

    .clear-all {
      background: none;
      border: none;
      color: #3b82f6;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    .clear-all:hover {
      text-decoration: underline;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      background: white;
      border-radius: 12px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      margin: 16px 0 0;
      color: #64748b;
    }

    /* Error Message */
    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      margin-bottom: 24px;
    }

    .error-message button {
      margin-left: auto;
      padding: 8px 16px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    /* Orders Card */
    .orders-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .table-responsive {
      overflow-x: auto;
    }

    /* Table */
    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th {
      padding: 14px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }

    .orders-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .orders-table th.sortable:hover {
      color: #3b82f6;
    }

    .orders-table th.sorted {
      color: #3b82f6;
    }

    .sort-icon {
      margin-left: 4px;
    }

    .orders-table td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .order-row {
      transition: background-color 0.15s;
    }

    .order-row:hover {
      background: #f8fafc;
    }

    /* Order ID Cell */
    .order-id-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-id {
      font-weight: 600;
      color: #3b82f6;
      font-size: 14px;
    }

    .order-type {
      display: inline-block;
      padding: 2px 8px;
      background: #e0f2fe;
      color: #0284c7;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      width: fit-content;
    }

    /* Customer Cell */
    .customer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .customer-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: #1e293b;
    }

    .customer-name svg {
      color: #94a3b8;
    }

    .customer-phone {
      font-size: 13px;
      color: #64748b;
    }

    /* Amount Cell */
    .amount-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .amount {
      font-weight: 600;
      color: #059669;
      font-size: 15px;
    }

    .items-count {
      font-size: 12px;
      color: #94a3b8;
    }

    /* Enhanced Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .status-icon {
      font-size: 14px;
      line-height: 1;
    }

    /* Enhanced Payment Badge */
    .payment-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .payment-icon {
      font-size: 14px;
    }

    /* Date Cell */
    .date-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .date {
      font-weight: 500;
      color: #1e293b;
    }

    .time {
      font-size: 12px;
      color: #94a3b8;
    }

    /* Actions */
    .actions-wrapper {
      position: relative;
    }

    .actions-dropdown {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .btn-action {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: #f1f5f9;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-action:hover {
      background: #e2e8f0;
      color: #3b82f6;
    }

    .btn-action.btn-status {
      color: #10b981;
    }

    .btn-action.btn-status:hover {
      background: #d1fae5;
    }

    .btn-action.btn-danger:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    /* Status Dropdown Menu */
    .status-dropdown {
      position: relative;
    }

    .status-dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 180px;
      z-index: 100;
      overflow: hidden;
    }

    .dropdown-header {
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: none;
      font-size: 13px;
      color: #1e293b;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
    }

    .dropdown-item:hover {
      background: #f1f5f9;
    }

    .dropdown-item.active {
      background: #eff6ff;
      color: #3b82f6;
      font-weight: 600;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .empty-state svg {
      color: #cbd5e1;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: #475569;
    }

    .empty-state p {
      margin: 0 0 24px;
      color: #94a3b8;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 16px;
    }

    .pagination-info {
      font-size: 14px;
      color: #64748b;
    }

    .pagination-controls {
      display: flex;
      gap: 4px;
    }

    .btn-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      padding: 0 8px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      color: #475569;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-page:hover:not(:disabled) {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .btn-page.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-size {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-size label {
      font-size: 14px;
      color: #64748b;
    }

    .page-size select {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      color: #475569;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .orders-container {
        padding: 16px;
      }

      .filters-row {
        gap: 12px;
      }

      .filter-group {
        min-width: 140px;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filters-row {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
      }

      .pagination {
        flex-direction: column;
        gap: 12px;
      }

      .orders-table th:nth-child(6),
      .orders-table td:nth-child(6) {
        display: none;
      }
    }
  `]
})
export class OrdersListComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private statusHelper = inject(StatusHelperService);

  // Status configurations
  orderStatuses: OrderStatusConfig[] = ORDER_STATUSES;
  paymentStatuses: PaymentStatusConfig[] = PAYMENT_STATUSES;

  // Data
  orders = signal<Order[]>([]);
  filteredOrders = signal<Order[]>([]);
  availableShops = computed(() => this.authService.shops());

  // Shop selection
  selectedShopId = signal<string>('');

  // Filters
  statusFilter = '';
  paymentStatusFilter = '';
  searchQuery = '';
  startDate = '';
  endDate = '';

  // Pagination
  currentPage = signal(1);
  pageSize = 10;

  // Sorting
  sortConfig = signal<SortConfig>({ column: 'orderDate', direction: 'desc' });

  // Role indicator
  isOwner = computed(() => this.authService.userRole() === 'Owner');

  // UI State
  loading = signal(true);
  error = signal<string | null>(null);
  openStatusDropdown = signal<string | null>(null);

  // Computed values
  totalOrders = computed(() => this.filteredOrders().length);
  
  totalPages = computed(() => Math.ceil(this.totalOrders() / this.pageSize));
  
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);
  
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.totalOrders()));
  
  paginatedOrders = computed(() => {
    const orders = this.filteredOrders();
    return orders.slice(this.startIndex(), this.endIndex());
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(5, total);
      } else {
        start = Math.max(1, total - 4);
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  private searchDebounceTimer: any;

  ngOnInit(): void {
    const authSelectedShop = this.authService.selectedShopId();
    if (authSelectedShop) {
      this.selectedShopId.set(authSelectedShop);
    }
    this.loadOrders();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  private handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-dropdown')) {
      this.openStatusDropdown.set(null);
    }
  }

  loadOrders(): void {
    const shopId = this.selectedShopId() || this.authService.selectedShopId();
    if (!shopId) {
      this.error.set('Shop not selected');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.orderService.getShopOrders(shopId).subscribe({
      next: (response) => {
        const orders: Order[] = response.data || [];
        this.orders.set(orders);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load orders');
        this.loading.set(false);
      }
    });
  }

  onShopChange(): void {
    const shopId = this.selectedShopId();
    if (shopId) {
      this.authService.setSelectedShop(shopId);
      this.resetFilters();
      this.loadOrders();
    }
  }

  onSearchInput(): void {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.orders()];

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(order => order.orderStatus === this.statusFilter);
    }

    // Payment status filter
    if (this.paymentStatusFilter) {
      filtered = filtered.filter(order => order.paymentStatus === this.paymentStatusFilter);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query)
      );
    }

    // Date filter
    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(order => new Date(order.orderDate) >= start);
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(order => new Date(order.orderDate) <= end);
    }

    // Apply sorting
    filtered = this.sortOrders(filtered);

    this.filteredOrders.set(filtered);
    this.currentPage.set(1);
  }

  sort(column: string): void {
    const current = this.sortConfig();
    if (current.column === column) {
      this.sortConfig.set({
        column,
        direction: current.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      this.sortConfig.set({ column, direction: 'desc' });
    }
    this.applyFilters();
  }

  private sortOrders(orders: Order[]): Order[] {
    const { column, direction } = this.sortConfig();
    
    return orders.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (column) {
        case 'orderId':
          valueA = a.orderId.toLowerCase();
          valueB = b.orderId.toLowerCase();
          break;
        case 'customerName':
          valueA = a.customerName.toLowerCase();
          valueB = b.customerName.toLowerCase();
          break;
        case 'totalAmount':
          valueA = a.totalAmount;
          valueB = b.totalAmount;
          break;
        case 'orderDate':
          valueA = new Date(a.orderDate).getTime();
          valueB = new Date(b.orderDate).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.statusFilter || this.paymentStatusFilter || this.searchQuery || this.startDate || this.endDate);
  }

  clearAllFilters(): void {
    this.resetFilters();
    this.applyFilters();
  }

  private resetFilters(): void {
    this.statusFilter = '';
    this.paymentStatusFilter = '';
    this.searchQuery = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onPageSizeChange(): void {
    this.currentPage.set(1);
  }

  // =====================================================
  // Status Helper Methods using StatusHelperService
  // =====================================================

  getStatusLabel(value: string): string {
    return this.statusHelper.getOrderStatusLabel(value);
  }

  getPaymentLabel(value: string): string {
    return this.statusHelper.getPaymentStatusLabel(value);
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() || '';
  }

  formatStatus(status: string): string {
    return this.statusHelper.formatStatus(status);
  }

  getStatusColor(status: string): string {
    return this.statusHelper.getOrderStatusColor(status);
  }

  getStatusBgColor(status: string): string {
    return this.statusHelper.getOrderStatusBgColor(status);
  }

  getStatusIcon(status: string): string {
    return this.statusHelper.getOrderStatusIcon(status);
  }

  // Payment formatting
  getPaymentClass(status: string): string {
    return status?.toLowerCase() || '';
  }

  formatPayment(status: string): string {
    return this.statusHelper.formatStatus(status);
  }

  getPaymentColor(status: string): string {
    return this.statusHelper.getPaymentStatusColor(status);
  }

  getPaymentBgColor(status: string): string {
    return this.statusHelper.getPaymentStatusBgColor(status);
  }

  getPaymentIcon(status: string): string {
    return this.statusHelper.getPaymentStatusIcon(status);
  }

  // =====================================================
  // Quick Status Change Methods
  // =====================================================

  canChangeStatus(order: Order): boolean {
    // Can change status if not delivered or cancelled
    const nonEditableStatuses = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'];
    return !nonEditableStatuses.includes(order.orderStatus);
  }

  toggleStatusDropdown(order: Order): void {
    if (this.openStatusDropdown() === order.orderId) {
      this.openStatusDropdown.set(null);
    } else {
      this.openStatusDropdown.set(order.orderId);
    }
  }

  changeStatus(order: Order, newStatus: string): void {
    if (confirm(`Change order status from ${this.formatStatus(order.orderStatus)} to ${this.formatStatus(newStatus)}?`)) {
      this.orderService.updateOrderStatus(order.orderId, newStatus).subscribe({
        next: (response) => {
          // Update the order in the local list
          const updatedOrders = this.orders().map(o => 
            o.orderId === order.orderId ? { ...o, orderStatus: newStatus as any } : o
          );
          this.orders.set(updatedOrders);
          this.applyFilters();
          this.openStatusDropdown.set(null);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update status');
        }
      });
    }
  }

  // =====================================================
  // Additional Methods
  // =====================================================

  isOrderDelayed(order: Order): boolean {
    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED' || 
        order.orderStatus === 'COMPLETED' || order.orderStatus === 'RETURNED') {
      return false;
    }
    const orderDate = new Date(order.orderDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  }

  canDelete(order: Order): boolean {
    return order.orderStatus === 'PENDING' || order.orderStatus === 'CANCELLED' || order.orderStatus === 'DRAFT';
  }

  // Actions
  viewOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  editOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId, 'edit']);
  }

  createOrder(): void {
    this.router.navigate(['/orders/create']);
  }

  downloadInvoice(orderId: string): void {
    this.orderService.generateInvoice(orderId).subscribe({
      next: (response) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${orderId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error generating invoice:', err);
        this.error.set('Failed to generate invoice');
      }
    });
  }

  deleteOrder(order: Order): void {
    if (confirm(`Are you sure you want to delete order ${order.orderId}?`)) {
      this.orderService.deleteOrder(order.orderId).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to delete order');
        }
      });
    }
  }
}

