import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShopCustomer } from '../../../core/models';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.css'
})
export class CustomersListComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  customers = signal<ShopCustomer[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  customerTypeFilter = signal<string>('');
  currentPage = signal(1);
  totalPages = signal(1);
  totalCustomers = signal(0);

  selectedShopId = this.authService.selectedShopId;

  stats = signal<StatCard[]>([
    { title: 'Total Customers', value: 0, icon: '👥', color: '#3b82f6' },
    { title: 'Retail Customers', value: 0, icon: '🛒', color: '#10b981' },
    { title: 'Wholesale Customers', value: 0, icon: '🏢', color: '#f59e0b' },
    { title: 'Total Revenue', value: '₹0', icon: '💰', color: '#8b5cf6' }
  ]);

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    const shopId = this.selectedShopId();
    if (!shopId) return;

    this.loading.set(true);
    this.apiService.getShopCustomers(shopId, this.customerTypeFilter() || undefined).subscribe({
      next: (response) => {
        if (response.data) {
          // Backend returns array directly in response.data
          const customers = Array.isArray(response.data) ? response.data : [];
          // Map to ensure fullName is always a string
          const mappedCustomers = customers.map(c => ({
            ...c,
            fullName: c.fullName || c.customerName || '',
            phone: c.phone || c.customerPhone || '',
            email: c.email || c.customerEmail || ''
          }));
          this.customers.set(mappedCustomers as ShopCustomer[]);
          this.totalCustomers.set(customers.length);
          this.totalPages.set(1);
          this.updateStats();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loading.set(false);
      }
    });
  }

  updateStats(): void {
    const customerList = this.customers();
    const retailCount = customerList.filter(c => c.customerType === 'RETAIL').length;
    const wholesaleCount = customerList.filter(c => c.customerType === 'WHOLESALE').length;
    const totalRevenue = customerList.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);

    this.stats.set([
      { title: 'Total Customers', value: customerList.length, icon: '👥', color: '#3b82f6' },
      { title: 'Retail Customers', value: retailCount, icon: '🛒', color: '#10b981' },
      { title: 'Wholesale Customers', value: wholesaleCount, icon: '🏢', color: '#f59e0b' },
      { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: '#8b5cf6' }
    ]);
  }

  onSearch(): void {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      this.loadCustomers();
      return;
    }

    const filtered = this.customers().filter(customer =>
      customer.fullName?.toLowerCase().includes(term) ||
      customer.phone?.includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.companyName?.toLowerCase().includes(term)
    );
    this.customers.set(filtered);
  }

  filterByType(type: string): void {
    this.customerTypeFilter.set(type);
    this.loadCustomers();
  }

  deleteCustomer(customerId?: string): void {
    // ensure we have a valid id before proceeding
    if (!customerId) {
      console.warn('deleteCustomer called without id');
      return;
    }

    if (!confirm('Are you sure you want to delete this customer?')) return;

    this.apiService.deleteCustomer(customerId).subscribe({
      next: () => {
        this.loadCustomers();
      },
      error: (error) => {
        console.error('Error deleting customer:', error);
      }
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(v => v + 1);
      this.loadCustomers();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(v => v - 1);
      this.loadCustomers();
    }
  }
}
