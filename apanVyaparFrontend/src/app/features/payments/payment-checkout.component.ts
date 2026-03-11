import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-checkout-container">
      <div class="checkout-header">
        <h1>Complete Payment</h1>
        <p class="order-id">Order ID: {{ orderId() }}</p>
      </div>

      <div class="checkout-content">
        <!-- Order Summary -->
        <div class="order-summary">
          <h2>Order Summary</h2>
          <div class="summary-item">
            <span>Subtotal:</span>
            <span>₹{{ amount() }}</span>
          </div>
          <div class="summary-item">
            <span>Tax:</span>
            <span>₹{{ tax() }}</span>
          </div>
          <div class="summary-item total">
            <span>Total Amount:</span>
            <span>₹{{ totalAmount() }}</span>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="payment-methods">
          <h2>Select Payment Method</h2>
          <div class="methods-grid">
            <div
              *ngFor="let method of paymentMethods()"
              class="method-card"
              [class.selected]="method.selected"
              (click)="selectPaymentMethod(method.id)"
            >
              <img [src]="method.icon" [alt]="method.name" />
              <p>{{ method.name }}</p>
            </div>
          </div>
        </div>

        <!-- Payment Form -->
        <div class="payment-form" *ngIf="selectedPaymentMethod()">
          <div *ngIf="selectedPaymentMethod() === 'card'" class="card-form">
            <h3>Card Details</h3>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="customerEmail" placeholder="your@email.com" />
            </div>
            <div class="form-group">
              <label>Name on Card</label>
              <input type="text" [(ngModel)]="customerName" placeholder="Full Name" />
            </div>
          </div>

          <div *ngIf="selectedPaymentMethod() === 'upi'" class="upi-form">
            <h3>UPI Payment</h3>
            <div class="form-group">
              <label>UPI ID</label>
              <input type="text" [(ngModel)]="upiId" placeholder="user@bank" />
            </div>
          </div>

          <div *ngIf="selectedPaymentMethod() === 'netbanking'" class="netbanking-form">
            <h3>Net Banking</h3>
            <div class="form-group">
              <label>Select Bank</label>
              <select [(ngModel)]="selectedBank">
                <option value="">Select Bank</option>
                <option value="HDFC">HDFC Bank</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="AXIS">Axis Bank</option>
                <option value="SBI">SBI</option>
                <option value="YES">Yes Bank</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-cancel" (click)="cancelPayment()" [disabled]="processing()">
            Cancel
          </button>
          <button
            class="btn-pay"
            (click)="processPayment()"
            [disabled]="!selectedPaymentMethod() || processing()"
          >
            <span *ngIf="!processing()">Pay ₹{{ totalAmount() }}</span>
            <span *ngIf="processing()">Processing...</span>
          </button>
        </div>

        <!-- Error Message -->
        <div class="error-message" *ngIf="error()">
          {{ error() }}
        </div>

        <!-- Success Message -->
        <div class="success-message" *ngIf="successMessage()">
          {{ successMessage() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-checkout-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .checkout-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .checkout-header h1 {
      margin: 0 0 10px;
      color: #333;
    }

    .order-id {
      color: #666;
      font-size: 14px;
    }

    .checkout-content > div {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    h2 {
      margin: 0 0 15px;
      font-size: 16px;
      color: #333;
    }

    h3 {
      margin: 0 0 15px;
      font-size: 14px;
      color: #333;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }

    .summary-item.total {
      border: none;
      border-top: 2px solid #333;
      font-weight: bold;
      padding-top: 15px;
      margin-top: 10px;
    }

    .methods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 15px;
    }

    .method-card {
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .method-card:hover {
      border-color: #007bff;
    }

    .method-card.selected {
      border-color: #007bff;
      background-color: #f0f7ff;
    }

    .method-card img {
      width: 50px;
      height: 50px;
      margin-bottom: 10px;
    }

    .method-card p {
      margin: 0;
      font-size: 13px;
      color: #333;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 20px;
    }

    .btn-cancel,
    .btn-pay {
      padding: 12px 30px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-cancel {
      background-color: #f0f0f0;
      color: #333;
    }

    .btn-cancel:hover:not(:disabled) {
      background-color: #ddd;
    }

    .btn-pay {
      background-color: #007bff;
      color: white;
    }

    .btn-pay:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-cancel:disabled,
    .btn-pay:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      padding: 12px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      margin-top: 15px;
    }

    .success-message {
      padding: 12px;
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      margin-top: 15px;
    }
  `]
})
export class PaymentCheckoutComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Form data
  orderId = signal<string>('');
  amount = signal<number>(0);
  tax = signal<number>(0);
  selectedPaymentMethod = signal<string | null>(null);

  // Customer info
  customerEmail = '';
  customerName = '';
  upiId = '';
  selectedBank = '';

  // UI state
  processing = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Payment methods
  paymentMethods = signal<PaymentMethod[]>([
    { id: 'card', name: 'Credit/Debit Card', icon: '/assets/icons/card.png', selected: false },
    { id: 'upi', name: 'UPI', icon: '/assets/icons/upi.png', selected: false },
    { id: 'netbanking', name: 'Net Banking', icon: '/assets/icons/bank.png', selected: false },
  ]);

  get totalAmount(): (() => number) {
    return () => this.amount() + this.tax();
  }

  ngOnInit(): void {
    // Get order ID from route params or query params
    this.route.queryParams.subscribe(params => {
      if (params['orderId']) {
        this.orderId.set(params['orderId']);
        this.amount.set(parseFloat(params['amount']) || 0);
        this.tax.set(parseFloat(params['tax']) || 0);
      }
    });

    // Load customer email from auth
    const user = this.authService.currentUser();
    if (user) {
      this.customerEmail = user.email || '';
      this.customerName = user.fullName || '';
    }
  }

  selectPaymentMethod(methodId: string): void {
    this.selectedPaymentMethod.set(methodId);
    this.error.set(null);
  }

  processPayment(): void {
    if (!this.selectedPaymentMethod()) {
      this.error.set('Please select a payment method');
      return;
    }

    const shopId = this.authService.selectedShopId();
    if (!shopId) {
      this.error.set('Shop not selected');
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    const method = this.selectedPaymentMethod();

    switch (method) {
      case 'card':
        this.processCardPayment(shopId);
        break;
      case 'upi':
        this.processUPIPayment(shopId);
        break;
      case 'netbanking':
        this.processNetBankingPayment(shopId);
        break;
    }
  }

  private processCardPayment(shopId: string): void {
    this.paymentService.createRazorpayOrder(
      shopId,
      this.orderId(),
      this.totalAmount()
    ).subscribe({
      next: (response: any) => {
        const razorpayOrderId = response.data.razorpayOrderId;

        const options = {
          key: 'YOUR_RAZORPAY_KEY_ID', // Get from environment
          amount: this.totalAmount() * 100, // Razorpay expects amount in paise
          currency: 'INR',
          name: 'Apna Vyapar',
          description: `Order ${this.orderId()}`,
          order_id: razorpayOrderId,
          handler: (res: any) => {
            this.verifyPayment(shopId, res);
          },
          prefill: {
            name: this.customerName,
            email: this.customerEmail,
          },
          theme: {
            color: '#007bff',
          },
        };

        this.paymentService.openRazorpayCheckout(options)
          .catch(() => {
            this.processing.set(false);
            this.error.set('Failed to open payment gateway');
          });
      },
      error: (err: any) => {
        this.processing.set(false);
        this.error.set(err.error?.message || 'Failed to create payment order');
      }
    });
  }

  private processUPIPayment(shopId: string): void {
    if (!this.upiId) {
      this.error.set('Please enter UPI ID');
      this.processing.set(false);
      return;
    }

    this.paymentService.createUPICollect(
      shopId,
      this.orderId(),
      this.totalAmount(),
      this.upiId
    ).subscribe({
      next: () => {
        this.successMessage.set('Payment initiated. Please complete in your UPI app.');
        this.processing.set(false);
        setTimeout(() => {
          this.router.navigate(['/orders', this.orderId()]);
        }, 2000);
      },
      error: (err: any) => {
        this.processing.set(false);
        this.error.set(err.error?.message || 'Failed to initiate UPI payment');
      }
    });
  }

  private processNetBankingPayment(shopId: string): void {
    if (!this.selectedBank) {
      this.error.set('Please select a bank');
      this.processing.set(false);
      return;
    }

    this.paymentService.generatePaymentLink(shopId, {
      orderId: this.orderId(),
      amount: this.totalAmount(),
      customerEmail: this.customerEmail,
      bank: this.selectedBank
    }).subscribe({
      next: (response: any) => {
        // Open payment link in new window
        window.open(response.data.paymentLinkUrl, '_blank');
        this.successMessage.set('Please complete payment in the opened window');
        this.processing.set(false);
      },
      error: (err: any) => {
        this.processing.set(false);
        this.error.set(err.error?.message || 'Failed to generate payment link');
      }
    });
  }

  private verifyPayment(shopId: string, paymentData: any): void {
    this.paymentService.verifyPayment(shopId, paymentData).subscribe({
      next: () => {
        this.successMessage.set('Payment successful!');
        this.processing.set(false);
        setTimeout(() => {
          this.router.navigate(['/orders', this.orderId()]);
        }, 2000);
      },
      error: (err: any) => {
        this.processing.set(false);
        this.error.set(err.error?.message || 'Payment verification failed');
      }
    });
  }

  cancelPayment(): void {
    this.router.navigate(['/orders', this.orderId()]);
  }
}
