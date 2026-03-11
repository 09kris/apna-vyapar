import { Component, OnInit, signal, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersChart') ordersChartRef!: ElementRef<HTMLCanvasElement>;
  
  private salesChart?: Chart;
  private ordersChart?: Chart;
  private authService = inject(AuthService);
  
  currentUser = this.authService.currentUser;
  
  stats = signal<StatCard[]>([
    { title: 'Total Products', value: 0, icon: '📦', color: '#3b82f6' },
    { title: 'Active Orders', value: 0, icon: '🛒', color: '#10b981' },
    { title: 'Total Customers', value: 0, icon: '👥', color: '#f59e0b' },
    { title: 'Revenue Today', value: '₹0', icon: '💰', color: '#8b5cf6' }
  ]);
  
  ngOnInit(): void {
    // TODO: Fetch actual stats from API
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 500);
  }

  initCharts(): void {
    this.createSalesChart();
    this.createOrdersChart();
  }

  createSalesChart(): void {
    if (!this.salesChartRef) return;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [12000, 19000, 15000, 25000, 22000, 30000];

    this.salesChart = new Chart(this.salesChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Sales (₹)',
          data: data,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  createOrdersChart(): void {
    if (!this.ordersChartRef) return;
    const data = [45, 52, 38, 65, 59, 80];

    this.ordersChart = new Chart(this.ordersChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Orders',
          data: data,
          backgroundColor: '#10b981',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}
