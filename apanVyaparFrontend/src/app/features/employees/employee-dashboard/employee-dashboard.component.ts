import { Component, OnInit, inject, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  employeesByType: { employeeType: string; count: number }[];
  employeesByEmploymentType: { employmentType: string; count: number }[];
  employeesByDepartment: { department: string; count: number }[];
  totalMonthlySalary: number;
  averageSalary: number;
  recentEmployees: any[];
  newEmployeesThisMonth: number;
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.css'
})
export class EmployeeDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('employeeTypeChart') employeeTypeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salaryChart') salaryChartRef!: ElementRef<HTMLCanvasElement>;
  
  private employeeTypeChart?: Chart;
  private salaryChart?: Chart;
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  stats = signal<EmployeeStats | null>(null);
  selectedShopId = signal<string>('');

  ngOnInit(): void {
    this.initializeShopSelection();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 500);
  }

  initCharts(): void {
    if (this.stats()) {
      this.createEmployeeTypeChart();
      this.createSalaryChart();
    }
  }

  createEmployeeTypeChart(): void {
    if (!this.employeeTypeChartRef || !this.stats()) return;
    const types = this.stats()!.employeesByType || [];
    this.employeeTypeChart = new Chart(this.employeeTypeChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: types.map(t => t.employeeType),
        datasets: [{
          data: types.map(t => t.count),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  createSalaryChart(): void {
    if (!this.salaryChartRef || !this.stats()) return;
    const depts = this.stats()!.employeesByDepartment || [];
    this.salaryChart = new Chart(this.salaryChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: depts.map(d => d.department),
        datasets: [{
          label: 'Employees',
          data: depts.map(d => d.count),
          backgroundColor: '#8b5cf6',
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

  initializeShopSelection(): void {
    const queryShopId = this.authService.selectedShopId();
    const userShops = this.authService.shops();

    if (queryShopId) {
      this.selectedShopId.set(queryShopId);
      this.loadEmployeeStats();
    } else if (userShops.length > 0) {
      this.selectedShopId.set(userShops[0].shopId);
      this.loadEmployeeStats();
    } else {
      this.error.set('No shops found. Please create a shop first.');
      this.loading.set(false);
    }
  }

  loadEmployeeStats(): void {
    const shopId = this.selectedShopId();
    if (!shopId) return;

    this.loading.set(true);
    this.error.set(null);

    this.apiService.getEmployeeStats(shopId).subscribe({
      next: (response) => {
        this.stats.set(response.data || null);
        this.loading.set(false);
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load employee statistics');
        this.loading.set(false);
      }
    });
  }

  refreshStats(): void {
    this.loadEmployeeStats();
  }

  getEmployeeTypeClass(type: string): string {
    if (!type) return '';
    return type.toLowerCase() === 'manager' ? 'manager' : 'worker';
  }

  getEmploymentTypeClass(type: string): string {
    if (!type) return '';
    return type.toLowerCase().replace(' ', '-');
  }
}
