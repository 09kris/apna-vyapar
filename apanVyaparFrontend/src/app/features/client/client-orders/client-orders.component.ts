import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-client-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-orders.component.html',
  styleUrl: './client-orders.component.css'
})
export class ClientOrdersComponent implements OnInit {
  private apiService = inject(ApiService);

  orders = signal<any[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  statusFilter = signal<string>('');

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.apiService.getMyOrders(this.currentPage(), 10, this.statusFilter() || undefined).subscribe({
      next: (response) => {
        if (response.success && response.data?.orders) {
          this.orders.set(response.data.orders);
          this.totalPages.set(response.data.totalPages || 1);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filterByStatus(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadOrders();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(v => v + 1);
      this.loadOrders();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(v => v - 1);
      this.loadOrders();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'PACKED': return 'status-packed';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }
}

