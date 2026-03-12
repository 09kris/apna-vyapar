import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

// UI-specific transaction type to avoid clashing with the backend model
interface UILoyaltyTransaction {
  id: string;
  shopId: string;
  transactionType: 'Earn' | 'Redeem' | 'Expire' | 'Adjust';
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
  transactions = signal<UILoyaltyTransaction[]>([]);

  ngOnInit(): void {
    this.loadLoyaltyData();
  }

  loadLoyaltyData(): void {
    this.apiService.getMyLoyaltyPoints().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.totalPoints.set(response.data.totalPoints || 0);
          // convert backend transactions to UI shape
          const mapped: UILoyaltyTransaction[] = (response.data.transactions || []).map(txn => ({
            id: txn.id,
            shopId: txn.shopId,
            transactionType: txn.type === 'EARN' ? 'Earn' : txn.type === 'REDEEM' ? 'Redeem' : txn.type === 'EXPIRE' ? 'Expire' : 'Adjust',
            pointsChange: txn.type === 'REDEEM' ? -txn.points : txn.points,
            balanceBefore: 0,
            balanceAfter: 0,
            reason: txn.description,
            createdAt: new Date(txn.createdAt),
            shop: (txn as any).shop || undefined
          }));
          this.transactions.set(mapped);
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

