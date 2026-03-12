import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, ApiResponse, OrderStatusHistory } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = '/api/orders';

  getShopOrders(shopId: string): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(`${this.baseUrl}/${shopId}`);
  }

  getOrder(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/order/${orderId}`);
  }

  createOrder(shopId: string, orderData: any): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/${shopId}`, orderData);
  }

  updateOrder(orderId: string, orderData: any): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.baseUrl}/order/${orderId}`, orderData);
  }

  deleteOrder(orderId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/order/${orderId}`);
  }

  updateOrderStatus(orderId: string, status: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.baseUrl}/order/${orderId}/status`, { status });
  }

  updateOrderPaymentStatus(orderId: string, status: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.baseUrl}/order/${orderId}/payment-status`, { status });
  }

  cancelOrder(orderId: string, reason: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.baseUrl}/order/${orderId}/cancel`, { reason });
  }

  getOrderStatusHistory(orderId: string, type?: 'ORDER_STATUS' | 'PAYMENT_STATUS'): Observable<ApiResponse<OrderStatusHistory[]>> {
    const url = type 
      ? `${this.baseUrl}/order/${orderId}/history?type=${type}`
      : `${this.baseUrl}/order/${orderId}/history`;
    return this.http.get<ApiResponse<OrderStatusHistory[]>>(url);
  }

  generateInvoice(orderId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/order/${orderId}/invoice`, {
      responseType: 'blob'
    });
  }

  downloadInvoice(orderId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/order/${orderId}/invoice/download`, {
      responseType: 'blob'
    });
  }

  sendInvoiceEmail(orderId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/order/${orderId}/invoice/email`, {});
  }

  // Draft management methods
  getDraft(shopId: string): any {
    const draftKey = `order_draft_${shopId}`;
    const draft = localStorage.getItem(draftKey);
    return draft ? JSON.parse(draft) : null;
  }

  saveDraft(shopId: string, draft: any): void {
    const draftKey = `order_draft_${shopId}`;
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }

  clearDraft(shopId: string): void {
    const draftKey = `order_draft_${shopId}`;
    localStorage.removeItem(draftKey);
  }
}

// Re-export for convenience
export type { Order, OrderItem, OrderStatusHistory } from '../models';

