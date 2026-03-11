import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Payroll, Employee, Shop } from '../../../core/models';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './payroll-list.component.html',
  styleUrl: './payroll-list.component.css'
})
export class PayrollListComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  payrolls = signal<Payroll[]>([]);
  employees = signal<Employee[]>([]);
  shops = signal<Shop[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filter states
  selectedShopId = signal<string>('');
  selectedEmployeeId = signal<string>('');
  selectedMonth = signal<string>('');
  
  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pageSize = 10;

  ngOnInit(): void {
    this.loadShopsFromAuth();
    this.route.queryParams.subscribe(params => {
      if (params['shopId']) {
        this.selectedShopId.set(params['shopId']);
      }
      this.loadEmployees();
      this.loadPayrolls();
    });
  }

  loadShopsFromAuth(): void {
    const userShops = this.authService.shops();
    
    if (userShops.length > 0) {
      this.shops.set(userShops);
      this.initializeShopSelection();
    } else {
      this.loadShopsFromApi();
    }
  }

  loadShopsFromApi(): void {
    this.apiService.getShops().subscribe({
      next: (response) => {
        this.shops.set(response.data || []);
        if (this.shops().length > 0) {
          this.initializeShopSelection();
        } else {
          this.error.set('No shops found. Please create a shop first.');
        }
      },
      error: (err) => {
        console.error('Failed to load shops:', err);
        this.error.set('Failed to load shops. Please try again.');
      }
    });
  }

  initializeShopSelection(): void {
    const queryShopId = this.route.snapshot.queryParams['shopId'];
    const selectedShopId = this.authService.selectedShopId();

    if (queryShopId) {
      this.selectedShopId.set(queryShopId);
    } else if (selectedShopId) {
      this.selectedShopId.set(selectedShopId);
    } else if (this.shops().length > 0) {
      this.selectedShopId.set(this.shops()[0].shopId);
    }
  }

  loadEmployees(): void {
    const shopId = this.selectedShopId();
    if (!shopId) return;

    this.apiService.getEmployees(shopId, 1, 100).subscribe({
      next: (response) => {
        this.employees.set(response.data.items || []);
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
      }
    });
  }

  loadPayrolls(): void {
    this.loading.set(true);
    this.error.set(null);

    const shopId = this.selectedShopId();
    const page = this.currentPage();

    if (!shopId) {
      this.loading.set(false);
      return;
    }

    this.apiService.getPayrolls(
      shopId,
      this.selectedEmployeeId() || undefined,
      this.selectedMonth() || undefined,
      page,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.payrolls.set(response.data?.items || []);
        this.totalItems.set(response.data?.total || 0);
        this.totalPages.set(response.data?.totalPages || 1);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load payrolls');
        this.loading.set(false);
      }
    });
  }

  onShopChange(): void {
    this.currentPage.set(1);
    this.selectedEmployeeId.set('');
    this.loadEmployees();
    this.loadPayrolls();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadPayrolls();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPayrolls();
    }
  }

  deletePayroll(payroll: Payroll): void {
    if (!confirm('Are you sure you want to delete this payroll record?')) {
      return;
    }

    this.apiService.deletePayroll(payroll.id).subscribe({
      next: () => {
        this.loadPayrolls();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete payroll');
      }
    });
  }

  getEmployeeName(payroll: Payroll): string {
    if (payroll.employee?.user) {
      return payroll.employee.user.fullName || 'N/A';
    }
    return 'N/A';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID': return 'status-paid';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-failed';
      default: return '';
    }
  }

  getMonths(): { value: string; label: string }[] {
    const months: { value: string; label: string }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    
    return months;
  }
}

