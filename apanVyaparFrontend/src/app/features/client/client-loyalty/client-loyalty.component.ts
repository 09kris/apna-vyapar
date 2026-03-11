import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface LoyaltyTransaction {
  id: string;
  shopId: string;
  transactionType: 'Earn' | 'Redeem' | 'Expire';
  pointsChange: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  createdAt: Date;
  shop?: {
    shopName: string;
    city: string;
  };
}

@Component({
  selector: 'app-client-loyalty',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-loyalty.component.html',
  styleUrl: './client-loyalty.component.css'
})
export class ClientLoyaltyComponent implements OnInit {
  private apiService = inject(ApiService);

  loading = signal(true);
  totalPoints = signal(0);
  transactions = signal<LoyaltyTransaction[]>([]);

  ngOnInit(): void {
    this.loadLoyaltyData();
  }

  loadLoyaltyData(): void {
    this.apiService.getMyLoyaltyPoints().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.totalPoints.set(response.data.totalPoints || 0);
          this.transactions.set(response.data.transactions || []);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getTransactionClass(type: string): string {
    switch (type) {
      case 'Earn': return 'transaction-earn';
      case 'Redeem': return 'transaction-redeem';
      case 'Expire': return 'transaction-expire';
      default: return '';
    }
  }
}

