import { Injectable } from '@angular/core';

export interface OrderStatusConfig {
  value: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface PaymentStatusConfig {
  value: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

// Export status arrays as constants
export const ORDER_STATUSES: OrderStatusConfig[] = [
  { value: 'PENDING', label: 'Pending', icon: '⏳', color: '#f59e0b', bgColor: '#fef3c7' },
  { value: 'CONFIRMED', label: 'Confirmed', icon: '✓', color: '#3b82f6', bgColor: '#dbeafe' },
  { value: 'PROCESSING', label: 'Processing', icon: '⚙️', color: '#8b5cf6', bgColor: '#ede9fe' },
  { value: 'SHIPPED', label: 'Shipped', icon: '🚚', color: '#06b6d4', bgColor: '#cffafe' },
  { value: 'DELIVERED', label: 'Delivered', icon: '✅', color: '#10b981', bgColor: '#d1fae5' },
  { value: 'CANCELLED', label: 'Cancelled', icon: '❌', color: '#ef4444', bgColor: '#fee2e2' },
  { value: 'RETURNED', label: 'Returned', icon: '↩️', color: '#f97316', bgColor: '#ffedd5' },
  { value: 'DRAFT', label: 'Draft', icon: '📝', color: '#6b7280', bgColor: '#f3f4f6' },
  { value: 'COMPLETED', label: 'Completed', icon: '🎉', color: '#10b981', bgColor: '#d1fae5' }
];

export const PAYMENT_STATUSES: PaymentStatusConfig[] = [
  { value: 'PENDING', label: 'Pending', icon: '⏳', color: '#f59e0b', bgColor: '#fef3c7' },
  { value: 'PAID', label: 'Paid', icon: '✓', color: '#10b981', bgColor: '#d1fae5' },
  { value: 'FAILED', label: 'Failed', icon: '✗', color: '#ef4444', bgColor: '#fee2e2' },
  { value: 'REFUNDED', label: 'Refunded', icon: '↩️', color: '#8b5cf6', bgColor: '#ede9fe' },
  { value: 'PARTIAL', label: 'Partial', icon: '💵', color: '#f59e0b', bgColor: '#fef3c7' }
];

@Injectable({
  providedIn: 'root'
})
export class StatusHelperService {

  // Order Statuses
  readonly ORDER_STATUSES_ARRAY: OrderStatusConfig[] = ORDER_STATUSES;

  // Payment Statuses
  readonly PAYMENT_STATUSES_ARRAY: PaymentStatusConfig[] = PAYMENT_STATUSES;

  // Payment Methods
  readonly PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash', icon: '💵' },
    { value: 'CARD', label: 'Card', icon: '💳' },
    { value: 'UPI', label: 'UPI', icon: '📱' },
    { value: 'NETBANKING', label: 'Net Banking', icon: '🏦' },
    { value: 'WALLET', label: 'Wallet', icon: '👛' },
    { value: 'COD', label: 'Cash on Delivery', icon: '📦' }
  ];

  getOrderStatusLabel(value: string): string {
    const status = ORDER_STATUSES.find(s => s.value === value);
    return status?.label || value;
  }

  getPaymentStatusLabel(value: string): string {
    const status = PAYMENT_STATUSES.find(s => s.value === value);
    return status?.label || value;
  }

  getOrderStatusConfig(value: string): OrderStatusConfig | undefined {
    return ORDER_STATUSES.find(s => s.value === value);
  }

  getPaymentStatusConfig(value: string): PaymentStatusConfig | undefined {
    return PAYMENT_STATUSES.find(s => s.value === value);
  }

  formatStatus(status: string): string {
    if (!status) return '';
    return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
  }

  // Order Status Colors
  getOrderStatusColor(status: string): string {
    const config = this.getOrderStatusConfig(status);
    return config?.color || '#6b7280';
  }

  getOrderStatusBgColor(status: string): string {
    const config = this.getOrderStatusConfig(status);
    return config?.bgColor || '#f3f4f6';
  }

  getOrderStatusIcon(status: string): string {
    const config = this.getOrderStatusConfig(status);
    return config?.icon || '●';
  }

  // Payment Status Colors
  getPaymentStatusColor(status: string): string {
    const config = this.getPaymentStatusConfig(status);
    return config?.color || '#6b7280';
  }

  getPaymentStatusBgColor(status: string): string {
    const config = this.getPaymentStatusConfig(status);
    return config?.bgColor || '#f3f4f6';
  }

  getPaymentStatusIcon(status: string): string {
    const config = this.getPaymentStatusConfig(status);
    return config?.icon || '●';
  }

  // Check if status allows editing
  canEditOrderStatus(currentStatus: string): boolean {
    const nonEditableStatuses = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'];
    return !nonEditableStatuses.includes(currentStatus);
  }

  // Check if status allows deletion
  canDeleteOrder(currentStatus: string): boolean {
    const deletableStatuses = ['PENDING', 'DRAFT', 'CANCELLED'];
    return deletableStatuses.includes(currentStatus);
  }

  // Get next possible statuses
  getNextStatuses(currentStatus: string): string[] {
    const flow: { [key: string]: string[] } = {
      'PENDING': ['CONFIRMED', 'CANCELLED', 'DRAFT'],
      'DRAFT': ['PENDING', 'CANCELLED'],
      'CONFIRMED': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['SHIPPED', 'DELIVERED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'RETURNED'],
      'DELIVERED': ['RETURNED'],
      'CANCELLED': ['PENDING'],
      'RETURNED': [],
      'COMPLETED': []
    };
    return flow[currentStatus] || [];
  }

  // Get status message for display
  getStatusMessage(status: string): string {
    const messages: { [key: string]: string } = {
      'PENDING': 'Order is pending confirmation',
      'CONFIRMED': 'Order has been confirmed',
      'PROCESSING': 'Order is being processed',
      'SHIPPED': 'Order has been shipped',
      'DELIVERED': 'Order has been delivered',
      'CANCELLED': 'Order has been cancelled',
      'RETURNED': 'Order has been returned',
      'DRAFT': 'Order is in draft mode',
      'COMPLETED': 'Order has been completed'
    };
    return messages[status] || 'Status unknown';
  }
}

