import { Component, OnInit, signal, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface CustomerProfile {
  customerId: string;
  shopId: string;
  fullName: string;
  email?: string;
  phone: string;
  customerType: 'Retail' | 'Wholesale';
  loyaltyPoints: number;
  totalPurchases: number;
  shop?: {
    shopName: string;
    city: string;
  };
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('ordersChart') ordersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('spendingChart') spendingChartRef!: ElementRef<HTMLCanvasElement>;
  
  private ordersChart?: Chart;
  private spendingChart?: Chart;
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  profile = signal<CustomerProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  recentOrders = signal<any[]>([]);
  loyaltyPoints = signal<number>(0);
  allOrders = signal<any[]>([]);

  ngOnInit(): void {
    this.loadProfile();
    this.loadRecentOrders();
    this.loadLoyaltyPoints();
    this.loadAllOrders();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 500);
  }

  loadProfile(): void {
    this.apiService.getMyProfile().subscribe({
      next: (response) => {
        if (response.success && response.data?.customers?.length > 0) {
          this.profile.set(response.data.customers[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load profile');
        this.loading.set(false);
      }
    });
  }

  loadRecentOrders(): void {
    this.apiService.getMyOrders(1, 5).subscribe({
      next: (response) => {
        if (response.success && response.data?.orders) {
          this.recentOrders.set(response.data.orders);
        }
      },
      error: () => {
        // Silently fail for orders
      }
    });
  }

  loadLoyaltyPoints(): void {
    this.apiService.getMyLoyaltyPoints().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loyaltyPoints.set(response.data.totalPoints || 0);
        }
      },
      error: () => {
        // Silently fail
      }
    });
  }

  loadAllOrders(): void {
    this.apiService.getMyOrders(1, 100).subscribe({
      next: (response) => {
        if (response.success && response.data?.orders) {
          this.allOrders.set(response.data.orders);
          setTimeout(() => this.updateCharts(), 100);
        }
      },
      error: () => {}
    });
  }

  initCharts(): void {
    if (this.ordersChartRef && this.spendingChartRef) {
      this.createOrdersChart();
      this.createSpendingChart();
    }
  }

  updateCharts(): void {
    if (this.ordersChart) this.ordersChart.destroy();
    if (this.spendingChart) this.spendingChart.destroy();
    this.createOrdersChart();
    this.createSpendingChart();
  }

  createOrdersChart(): void {
    const orders = this.allOrders();
    const last6Months = this.getLast6Months();
    const orderCounts = last6Months.map(month => 
      orders.filter(o => new Date(o.createdAt).getMonth() === month.index && 
                         new Date(o.createdAt).getFullYear() === month.year).length
    );

    this.ordersChart = new Chart(this.ordersChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: last6Months.map(m => m.label),
        datasets: [{
          label: 'Orders',
          data: orderCounts,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  createSpendingChart(): void {
    const orders = this.allOrders();
    const last6Months = this.getLast6Months();
    const spending = last6Months.map(month => 
      orders.filter(o => new Date(o.createdAt).getMonth() === month.index && 
                         new Date(o.createdAt).getFullYear() === month.year)
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    );

    this.spendingChart = new Chart(this.spendingChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: last6Months.map(m => m.label),
        datasets: [{
          label: 'Spending (₹)',
          data: spending,
          backgroundColor: '#10b981',
          borderRadius: 8
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
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  getLast6Months(): { label: string; index: number; year: number }[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({ label: months[d.getMonth()], index: d.getMonth(), year: d.getFullYear() });
    }
    return result;
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

