import { Component, OnInit, inject, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Shop, DashboardStats } from '../../../core/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ShopWithStats extends Shop {
  stats?: DashboardStats;
  totalSales?: number;
  totalOrders?: number;
  totalCustomers?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('shopsChart') shopsChartRef!: ElementRef<HTMLCanvasElement>;
  
  private revenueChart?: Chart;
  private shopsChart?: Chart;
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  shops = signal<ShopWithStats[]>([]);
  loading = signal(true);
  selectedShop = signal<ShopWithStats | null>(null);
  showShopModal = signal(false);

  // Stats
  totalRevenue = signal(0);
  totalOrders = signal(0);
  totalCustomers = signal(0);
  totalShops = signal(0);

  ngOnInit(): void {
    this.loadShops();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 500);
  }

  initCharts(): void {
    this.createRevenueChart();
    this.createShopsChart();
  }

  createRevenueChart(): void {
    if (!this.revenueChartRef) return;
    this.revenueChart = new Chart(this.revenueChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue (₹)',
          data: [45000, 52000, 48000, 65000, 59000, 80000],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `₹${ctx.parsed.y?.toLocaleString('en-IN') ?? 0}`
            }
          }
        },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  createShopsChart(): void {
    if (!this.shopsChartRef) return;
    this.shopsChart = new Chart(this.shopsChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Retail', 'Wholesale', 'Both'],
        datasets: [{
          data: [this.shops().filter(s => s.shopType === 'Retail').length,
                 this.shops().filter(s => s.shopType === 'Wholesale').length,
                 this.shops().filter(s => s.shopType === 'Both').length],
          backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  loadShops(): void {
    this.loading.set(true);
    const userShops = this.authService.shops();
    
    if (userShops.length > 0) {
      this.shops.set(userShops);
      this.calculateTotalStats(userShops);
      this.loading.set(false);
    } else {
      this.apiService.getShops().subscribe({
        next: (response) => {
          this.shops.set(response.data || []);
          this.calculateTotalStats(response.data || []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }

  calculateTotalStats(shops: Shop[]): void {
    this.totalShops.set(shops.length);
    // For now, just set the shop count
    // In a real implementation, you'd fetch stats for each shop
    this.totalRevenue.set(0);
    this.totalOrders.set(0);
    this.totalCustomers.set(0);
  }

  selectShop(shop: ShopWithStats): void {
    this.selectedShop.set(shop);
    this.showShopModal.set(true);
  }

  closeModal(): void {
    this.showShopModal.set(false);
    this.selectedShop.set(null);
  }

  switchToShop(shop: Shop): void {
    this.authService.setSelectedShop(shop.shopId);
    this.closeModal();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  }

  getShopTypeIcon(type: string): string {
    switch (type) {
      case 'Retail': return '🏪';
      case 'Wholesale': return '🏭';
      case 'Both': return '🏬';
      default: return '🏪';
    }
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }
}
