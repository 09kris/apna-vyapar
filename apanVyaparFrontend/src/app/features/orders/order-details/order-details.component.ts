import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService, Order } from '../../../core/services/order.service';
import { StatusHelperService, ORDER_STATUSES, OrderStatusConfig, PAYMENT_STATUSES, PaymentStatusConfig } from '../../../core/services/status-helper.service';
import { OrderStatusHistoryComponent } from '../order-status-history/order-status-history.component';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OrderStatusHistoryComponent],
  template: `
    <div class="order-details-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="btn-back" routerLink="/orders">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Orders
          </button>
          <div class="order-title">
            <h1>Order Details</h1>
            <span class="order-id">{{ order()?.orderId }}</span>
          </div>
        </div>
        <div class="header-actions" *ngIf="order() as currentOrder">
          <button class="btn-secondary" (click)="editOrder()" *ngIf="!editing()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Order
          </button>
          <button class="btn-secondary" (click)="cancelEditing()" *ngIf="editing()">
            Cancel Editing
          </button>
          <button class="btn-primary" (click)="downloadInvoice()" *ngIf="currentOrder.orderStatus !== 'CANCELLED'">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Download Invoice
          </button>
        </div>
      </div>

      <!-- Success Toast -->
      <div class="toast toast-success" *ngIf="successMessage()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        {{ successMessage() }}
        <button (click)="successMessage.set(null)">×</button>
      </div>

      <!-- Error/Success Messages -->
      <div class="alert alert-error" *ngIf="error()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {{ error() }}
        <button (click)="error.set(null)">×</button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading order details...</p>
      </div>

      <div class="order-content" *ngIf="!loading() && order() as currentOrder">
        <!-- Status Banner with enhanced icons -->
        <div class="status-banner" [ngClass]="'banner-' + getStatusClass(currentOrder.orderStatus)">
          <div class="status-info">
            <span class="status-icon" [innerHTML]="getStatusSvgIcon(currentOrder.orderStatus)"></span>
            <div class="status-text">
              <strong>{{ formatStatus(currentOrder.orderStatus) }}</strong>
              <span>{{ getStatusMessage(currentOrder.orderStatus) }}</span>
            </div>
          </div>
          <div class="payment-status" [ngClass]="'payment-' + getPaymentClass(currentOrder.paymentStatus)">
            <span class="payment-dot"></span>
            {{ formatPayment(currentOrder.paymentStatus) }}
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Left Column -->
          <div class="content-main">
            <!-- Order Information Card -->
            <div class="info-card">
              <div class="card-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <h3>Order Information</h3>
              </div>
              <div class="card-body">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Order ID</span>
                    <span class="value">{{ currentOrder.orderId }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Order Number</span>
                    <span class="value">{{ currentOrder.orderNumber || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Order Date</span>
                    <span class="value">{{ currentOrder.orderDate | date:'medium' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Order Type</span>
                    <span class="value">{{ currentOrder.orderType || 'RETAIL' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Order Status</span>
                    <!-- Interactive Order Status Dropdown -->
                    <div class="status-dropdown-container" *ngIf="canChangeStatus(currentOrder); else staticOrderStatus">
                      <select 
                        class="status-select" 
                        [ngClass]="'status-' + getStatusClass(currentOrder.orderStatus)"
                        [value]="currentOrder.orderStatus"
                        (change)="onOrderStatusChange($event)"
                        [disabled]="updatingStatus()">
                        <option *ngFor="let status of getAvailableOrderStatuses(currentOrder.orderStatus)" [value]="status.value">
                          {{ status.label }}
                        </option>
                      </select>
                      <span class="status-loading" *ngIf="updatingStatus()">
                        <span class="spinner-small"></span>
                      </span>
                    </div>
                    <ng-template #staticOrderStatus>
                      <span class="status-badge" [ngClass]="'status-' + getStatusClass(currentOrder.orderStatus)"
                            [style.background-color]="getStatusBgColor(currentOrder.orderStatus)"
                            [style.color]="getStatusColor(currentOrder.orderStatus)">
                        <span class="status-icon-small">{{ getStatusIcon(currentOrder.orderStatus) }}</span>
                        {{ formatStatus(currentOrder.orderStatus) }}
                      </span>
                    </ng-template>
                  </div>
                  <div class="info-item">
                    <span class="label">Payment Status</span>
                    <!-- Interactive Payment Status Dropdown -->
                    <div class="status-dropdown-container">
                      <select 
                        class="status-select payment-select" 
                        [ngClass]="'payment-' + getPaymentClass(currentOrder.paymentStatus)"
                        [value]="currentOrder.paymentStatus"
                        (change)="onPaymentStatusChange($event)"
                        [disabled]="updatingStatus()">
                        <option *ngFor="let status of paymentStatuses" [value]="status.value">
                          {{ status.label }}
                        </option>
                      </select>
                      <span class="status-loading" *ngIf="updatingStatus()">
                        <span class="spinner-small"></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Information Card -->
            <div class="info-card">
              <div class="card-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h3>Customer Information</h3>
              </div>
              <div class="card-body">
                <div class="customer-profile">
                  <div class="customer-avatar">
                    {{ currentOrder.customerName.charAt(0).toUpperCase() }}
                  </div>
                  <div class="customer-details">
                    <strong>{{ currentOrder.customerName }}</strong>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      {{ currentOrder.customerPhone }}
                    </span>
                    <span *ngIf="currentOrder.customerEmail">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      {{ currentOrder.customerEmail }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Items Card -->
            <div class="info-card">
              <div class="card-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <h3>Order Items ({{ currentOrder.items.length || 0 }})</h3>
              </div>
              <div class="card-body">
                <div class="items-list">
                  <div class="item-row" *ngFor="let item of currentOrder.items">
                    <div class="item-info">
                      <span class="item-name">{{ item.productName }}</span>
                      <span class="item-code" *ngIf="item.productName">{{ item.productName }}</span>
                    </div>
                    <div class="item-qty">× {{ item.quantity }}</div>
                    <div class="item-price">
                      <span class="unit-price">₹{{ item.unitPrice | number:'1.2-2' }} each</span>
                      <span class="total-price">₹{{ (item.totalPrice || (item.quantity * item.unitPrice)) | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes Card -->
            <div class="info-card" *ngIf="currentOrder.notes || editing()">
              <div class="card-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <h3>Notes</h3>
              </div>
              <div class="card-body">
                <textarea
                  *ngIf="editing()"
                  [(ngModel)]="formData().notes"
                  placeholder="Add order notes..."
                  rows="4"
                  class="notes-input"
                ></textarea>
                <p *ngIf="!editing()" class="notes-text">{{ currentOrder.notes || 'No notes added' }}</p>
              </div>
            </div>

            <!-- Status History Timeline -->
            <div class="info-card" *ngIf="orderId">
              <app-order-status-history [orderId]="orderId" [initialTab]="'ORDER_STATUS'"></app-order-status-history>
            </div>
          </div>

          <!-- Right Column - Summary -->
          <div class="content-sidebar">
            <div class="summary-card">
              <div class="summary-header">
                <h3>Order Summary</h3>
              </div>
              <div class="summary-body">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>₹{{ currentOrder.subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="summary-row discount" *ngIf="currentOrder.discountAmount">
                  <span>Discount</span>
                  <span>-₹{{ currentOrder.discountAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-row">
                  <span>Tax</span>
                  <span>₹{{ currentOrder.taxAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-row grand-total">
                  <span>Total Amount</span>
                  <span>₹{{ currentOrder.totalAmount | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="actions-card">
              <button class="btn-primary full-width" (click)="makePayment()" *ngIf="currentOrder.paymentStatus === 'UNPAID'">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Make Payment
              </button>
              
              <button class="btn-danger full-width" (click)="cancelOrder()" *ngIf="currentOrder.orderStatus !== 'DELIVERED' && currentOrder.orderStatus !== 'CANCELLED'">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Cancel Order
              </button>
              
              <button class="btn-success full-width" (click)="saveChanges()" *ngIf="editing()" [disabled]="saving()">
                <span *ngIf="!saving()">Save Changes</span>
                <span *ngIf="saving()">
                  <span class="spinner-small"></span>
                  Saving...
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Container */
    .order-details-container {
      padding: 24px;
      background: #f8fafc;
      min-height: calc(100vh - 60px);
    }

    /* Toast Notifications */
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .toast-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .toast button {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      width: fit-content;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #f1f5f9;
      color: #3b82f6;
      border-color: #3b82f6;
    }

    .order-title {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .order-title h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }

    .order-id {
      font-size: 14px;
      color: #3b82f6;
      font-weight: 600;
      background: #eff6ff;
      padding: 4px 10px;
      border-radius: 4px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn-secondary, .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    /* Alerts */
    .alert {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-weight: 500;
    }

    .alert button {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
    }

    .alert-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    /* Loading */
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

    .spinner-small {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    .loading-state p {
      margin: 16px 0 0;
      color: #64748b;
    }

    /* Status Banner */
    .status-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .status-banner.banner-DRAFT {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border: 1px solid #9ca3af;
    }

    .status-banner.banner-PENDING {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
    }

    .status-banner.banner-CONFIRMED, .status-banner.banner-PROCESSING {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border: 1px solid #3b82f6;
    }

    .status-banner.banner-SHIPPED {
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border: 1px solid #6366f1;
    }

    .status-banner.banner-DELIVERED, .status-banner.banner-COMPLETED {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border: 1px solid #10b981;
    }

    .status-banner.banner-CANCELLED {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border: 1px solid #ef4444;
    }

    .status-banner.banner-RETURNED {
      background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
      border: 1px solid #f97316;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      font-size: 24px;
    }

    .status-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-text strong {
      font-size: 18px;
      color: #1e293b;
    }

    .status-text span {
      font-size: 14px;
      color: #64748b;
    }

    .payment-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 600;
    }

    .payment-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .payment-status.payment-UNPAID, .payment-status.payment-unpaid {
      background: #fee2e2;
      color: #991b1b;
    }
    .payment-status.payment-UNPAID .payment-dot, .payment-status.payment-unpaid .payment-dot { background: #ef4444; }

    .payment-status.payment-PARTIAL, .payment-status.payment-partial, 
    .payment-status.payment-PARTIALLY_PAID, .payment-status.payment-partially_paid {
      background: #fef3c7;
      color: #92400e;
    }
    .payment-status.payment-PARTIAL .payment-dot, .payment-status.payment-partial .payment-dot,
    .payment-status.payment-PARTIALLY_PAID .payment-dot, .payment-status.payment-partially_paid .payment-dot { background: #f59e0b; }

    .payment-status.payment-PAID, .payment-status.payment-paid {
      background: #d1fae5;
      color: #065f46;
    }
    .payment-status.payment-PAID .payment-dot, .payment-status.payment-paid .payment-dot { background: #10b981; }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .content-main {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Info Cards */
    .info-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }

    .card-header svg {
      color: #3b82f6;
    }

    .card-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .card-body {
      padding: 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    @media (max-width: 640px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .info-item .label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item .value {
      font-size: 15px;
      font-weight: 500;
      color: #1e293b;
    }

    /* Status Dropdown */
    .status-dropdown-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-select {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      background: white;
      transition: all 0.2s;
      min-width: 140px;
    }

    .status-select:hover {
      border-color: #3b82f6;
    }

    .status-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .status-select:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .status-select.status-PENDING { background: #fef3c7; color: #92400e; border-color: #f59e0b; }
    .status-select.status-CONFIRMED { background: #dbeafe; color: #1e40af; border-color: #3b82f6; }
    .status-select.status-PROCESSING { background: #ede9fe; color: #5b21b6; border-color: #7c3aed; }
    .status-select.status-SHIPPED { background: #e0e7ff; color: #3730a3; border-color: #6366f1; }
    .status-select.status-DELIVERED { background: #d1fae5; color: #065f46; border-color: #10b981; }
    .status-select.status-COMPLETED { background: #a7f3d0; color: #047857; border-color: #059669; }
    .status-select.status-CANCELLED { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
    .status-select.status-RETURNED { background: #ffedd5; color: #9a3412; border-color: #f97316; }

    .status-select.payment-select.payment-UNPAID { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
    .status-select.payment-select.payment-PAID { background: #d1fae5; color: #065f46; border-color: #10b981; }
    .status-select.payment-select.payment-PARTIALLY_PAID { background: #fef3c7; color: #92400e; border-color: #f59e0b; }
    .status-select.payment-select.payment-REFUNDED { background: #dbeafe; color: #1e40af; border-color: #3b82f6; }
    .status-select.payment-select.payment-FAILED { background: #fee2e2; color: #991b1b; border-color: #ef4444; }

    .status-loading {
      display: flex;
      align-items: center;
    }

    /* Enhanced Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .status-icon-small, .payment-icon-small {
      font-size: 14px;
    }

    /* Customer Profile */
    .customer-profile {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .customer-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 22px;
    }

    .customer-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .customer-details strong {
      font-size: 18px;
      color: #1e293b;
    }

    .customer-details span {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #64748b;
    }

    /* Items List */
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name {
      font-weight: 600;
      color: #1e293b;
    }

    .item-code {
      font-size: 12px;
      color: #64748b;
    }

    .item-qty {
      font-weight: 600;
      color: #64748b;
    }

    .item-price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .unit-price {
      font-size: 12px;
      color: #94a3b8;
    }

    .total-price {
      font-weight: 700;
      color: #059669;
    }

    /* Notes */
    .notes-input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      resize: vertical;
      font-family: inherit;
    }

    .notes-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .notes-text {
      color: #64748b;
      margin: 0;
    }

    /* Summary Card */
    .summary-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      margin-bottom: 16px;
    }

    .summary-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }

    .summary-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .summary-body {
      padding: 20px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      color: #475569;
    }

    .summary-row.discount {
      color: #10b981;
    }

    .summary-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 12px 0;
    }

    .summary-row.grand-total {
      padding-top: 16px;
      margin-top: 8px;
      border-top: 2px solid #1e293b;
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    /* Actions Card */
    .actions-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn-danger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      background: white;
      color: #ef4444;
      border: 1px solid #fecaca;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-danger:hover {
      background: #fef2f2;
    }

    .btn-success {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-success:hover:not(:disabled) {
      background: #059669;
    }

    .btn-success:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .full-width {
      width: 100%;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .btn-secondary, .btn-primary {
        width: 100%;
        justify-content: center;
      }

      .status-banner {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .status-info {
        flex-direction: column;
      }
    }
  `]
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private statusHelper = inject(StatusHelperService);

  // Status configurations
  orderStatuses: OrderStatusConfig[] = ORDER_STATUSES;
  paymentStatuses: PaymentStatusConfig[] = PAYMENT_STATUSES;

  // Data
  order = signal<Order | null>(null);
  formData = signal<Partial<Order>>({});
  orderId: string = '';

  // UI State
  loading = signal(true);
  editing = signal(false);
  saving = signal(false);
  updatingStatus = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadOrder(this.orderId);
    }
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  loadOrder(orderId: string): void {
    this.orderService.getOrder(orderId).subscribe({
      next: (response) => {
        this.order.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load order');
        this.loading.set(false);
      }
    });
  }

  editOrder(): void {
    this.editing.set(true);
    this.formData.set({ ...this.order() });
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.formData.set({});
  }

  saveChanges(): void {
    const orderId = this.order()?.orderId;
    if (!orderId) return;

    this.saving.set(true);

    this.orderService.updateOrder(orderId, this.formData() as any).subscribe({
      next: (response) => {
        this.order.set(response.data);
        this.editing.set(false);
        this.saving.set(false);
        this.showSuccess('Order updated successfully');
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update order');
        this.saving.set(false);
      }
    });
  }

  // Get available order statuses based on current status
  getAvailableOrderStatuses(currentStatus: string): OrderStatusConfig[] {
    // Return all statuses as editable for now (can be restricted based on business logic)
    return this.orderStatuses.filter(status => 
      status.value !== currentStatus
    );
  }

  // Handle Order Status Change
  onOrderStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    const order = this.order();
    
    if (!order || !newStatus || newStatus === order.orderStatus) return;

    if (confirm(`Change order status from ${this.formatStatus(order.orderStatus)} to ${this.formatStatus(newStatus)}?`)) {
      this.updatingStatus.set(true);
      this.orderService.updateOrderStatus(order.orderId, newStatus).subscribe({
        next: (response) => {
          this.order.set(response.data);
          this.updatingStatus.set(false);
          this.showSuccess(`Order status updated to ${this.formatStatus(newStatus)}`);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update order status');
          this.updatingStatus.set(false);
          // Reset select to current value
          select.value = order.orderStatus;
        }
      });
    } else {
      // Reset select if user cancelled
      select.value = order.orderStatus;
    }
  }

  // Handle Payment Status Change
  onPaymentStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    const order = this.order();
    
    if (!order || !newStatus || newStatus === order.paymentStatus) return;

    if (confirm(`Change payment status from ${this.formatPayment(order.paymentStatus)} to ${this.formatPayment(newStatus)}?`)) {
      this.updatingStatus.set(true);
      this.orderService.updateOrderPaymentStatus(order.orderId, newStatus).subscribe({
        next: (response) => {
          this.order.set(response.data);
          this.updatingStatus.set(false);
          this.showSuccess(`Payment status updated to ${this.formatPayment(newStatus)}`);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update payment status');
          this.updatingStatus.set(false);
          // Reset select to current value
          select.value = order.paymentStatus;
        }
      });
    } else {
      // Reset select if user cancelled
      select.value = order.paymentStatus;
    }
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.successMessage.set(null);
    }, 3000);
  }

  // =====================================================
  // Status Helper Methods
  // =====================================================

  getStatusClass(status: string): string {
    return status?.toUpperCase() || '';
  }

  formatStatus(status: string): string {
    return this.statusHelper.formatStatus(status);
  }

  getStatusMessage(status: string): string {
    return this.statusHelper.getStatusMessage(status);
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

  getStatusSvgIcon(status: string): string {
    const icon = this.statusHelper.getOrderStatusIcon(status);
    // Return SVG based on status
    switch (status) {
      case 'PENDING':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
      case 'CONFIRMED':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      case 'PROCESSING':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`;
      case 'SHIPPED':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`;
      case 'DELIVERED':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      case 'CANCELLED':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      case 'RETURNED':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;
      case 'COMPLETED':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
    }
  }

  getPaymentClass(status: string): string {
    return status?.toUpperCase() || '';
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
  // Status Update Methods
  // =====================================================

  canChangeStatus(order: Order): boolean {
    const nonEditableStatuses = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'];
    return !nonEditableStatuses.includes(order.orderStatus);
  }

  // =====================================================
  // Action Methods
  // =====================================================

  makePayment(): void {
    const order = this.order();
    if (order) {
      this.router.navigate(['/payments/checkout'], {
        queryParams: {
          orderId: order.orderId,
          amount: order.totalAmount,
          tax: order.taxAmount
        }
      });
    }
  }

  downloadInvoice(): void {
    const orderId = this.order()?.orderId;
    if (!orderId) return;
    
    this.orderService.generateInvoice(orderId).subscribe({
      next: (response) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${orderId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showSuccess('Invoice downloaded successfully');
      },
      error: (err) => {
        console.error('Error generating invoice:', err);
        this.error.set('Failed to generate invoice');
      }
    });
  }

  cancelOrder(): void {
    const orderId = this.order()?.orderId;
    if (!orderId) return;

    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(orderId, 'Customer requested cancellation').subscribe({
        next: () => {
          this.loadOrder(orderId);
          this.showSuccess('Order cancelled successfully');
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to cancel order');
        }
      });
    }
  }
}

