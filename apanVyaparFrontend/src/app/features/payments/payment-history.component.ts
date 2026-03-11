import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-history-container">
      <h2>Payment History</h2>
      <p>Payment history component - Coming soon</p>
      <p>This component will display all payments made for orders, including payment date, amount, method, and status.</p>
    </div>
  `,
  styles: [`
    .payment-history-container {
      padding: 20px;
      background: white;
      border-radius: 4px;
      margin: 20px;
    }
    
    h2 {
      color: #333;
    }
    
    p {
      color: #666;
      line-height: 1.6;
    }
  `]
})
export class PaymentHistoryComponent {}
