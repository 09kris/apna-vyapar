import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment, ApiResponse } from '../models';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = '/api/payments';

  getPayments(shopId: string): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.baseUrl}/${shopId}`);
  }

  getPayment(paymentId: string): Observable<ApiResponse<Payment>> {
    return this.http.get<ApiResponse<Payment>>(`${this.baseUrl}/${paymentId}`);
  }

  createPayment(shopId: string, paymentData: any): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(`${this.baseUrl}/${shopId}`, paymentData);
  }

  // Razorpay Integration
  createRazorpayOrder(shopId: string, orderId: string, amount: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/razorpay/order`, {
      shopId,
      orderId,
      amount
    });
  }

  verifyPayment(shopId: string, paymentData: any): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(`${this.baseUrl}/razorpay/verify`, {
      shopId,
      ...paymentData
    });
  }

  openRazorpayCheckout(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof Razorpay === 'undefined') {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const razorpay = new Razorpay(options);
      razorpay.open();

      razorpay.on('payment.success', (response: any) => {
        resolve(response);
      });

      razorpay.on('payment.error', (response: any) => {
        reject(response);
      });
    });
  }

  // UPI Payment
  createUPICollect(shopId: string, orderId: string, amount: number, upiId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/upi/collect`, {
      shopId,
      orderId,
      amount,
      upiId
    });
  }

  // Payment Link
  generatePaymentLink(shopId: string, data: {
    orderId: string;
    amount: number;
    customerEmail?: string;
    customerPhone?: string;
    description?: string;
    bank?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/link`, {
      shopId,
      ...data
    });
  }

  // Refund
  initiateRefund(paymentId: string, amount?: number, reason?: string): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(`${this.baseUrl}/${paymentId}/refund`, {
      amount,
      reason
    });
  }

  // Payment Status
  checkPaymentStatus(paymentId: string): Observable<ApiResponse<Payment>> {
    return this.http.get<ApiResponse<Payment>>(`${this.baseUrl}/${paymentId}/status`);
  }
}

