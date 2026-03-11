import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Shop } from '../../../core/models';

@Component({
  selector: 'app-shops-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './shops-list.component.html',
  styleUrl: './shops-list.component.css'
})
export class ShopsListComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  shops = signal<Shop[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadShops();
  }

  loadShops(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getShops().subscribe({
      next: (response) => {
        this.shops.set(response.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load shops');
        this.loading.set(false);
      }
    });
  }

  toggleShopStatus(shop: Shop): void {
    if (!confirm(`Are you sure you want to ${shop.isActive ? 'deactivate' : 'activate'} this shop?`)) {
      return;
    }

    this.apiService.updateShop(shop.shopId, { isActive: !shop.isActive } as any).subscribe({
      next: () => {
        this.loadShops();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update shop status');
      }
    });
  }

  deleteShop(shop: Shop): void {
    if (!confirm(`Are you sure you want to delete "${shop.shopName}"?`)) {
      return;
    }

    this.apiService.deleteShop(shop.shopId).subscribe({
      next: () => {
        this.loadShops();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete shop');
      }
    });
  }
}
