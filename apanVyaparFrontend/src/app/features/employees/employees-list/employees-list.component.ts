import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Employee, Shop } from '../../../core/models';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './employees-list.component.html',
  styleUrl: './employees-list.component.css'
})
export class EmployeesListComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  employees = signal<Employee[]>([]);
  shops = signal<Shop[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filter states
  selectedShopId = signal<string>('');
  searchQuery = signal<string>('');
  
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
    } else {
      this.error.set('No shops found. Please create a shop first.');
    }
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.error.set(null);

    const shopId = this.selectedShopId();
    const page = this.currentPage();

    this.apiService.getEmployees(shopId || undefined, page, this.pageSize).subscribe({
      next: (response) => {
        this.employees.set(response.data.items || []);
        this.totalItems.set(response.data.total);
        this.totalPages.set(response.data.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load employees');
        this.loading.set(false);
      }
    });
  }

  onShopChange(): void {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadEmployees();
    }
  }

  deleteEmployee(employee: Employee): void {
    if (!confirm(`Are you sure you want to terminate "${employee.firstName} ${employee.lastName || ''}"?`)) {
      return;
    }

    const employeeId = employee.employeeId || employee.id || '';
    if (!employeeId) {
      this.error.set('Employee ID is missing');
      return;
    }
    
    this.apiService.deleteEmployee(employeeId).subscribe({
      next: () => {
        this.loadEmployees();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to terminate employee');
      }
    });
  }

  toggleEmployeeStatus(employee: Employee): void {
    const newStatus = !employee.isActive;
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${employee.firstName} ${employee.lastName || ''}"?`)) {
      return;
    }

    const employeeId = employee.employeeId || employee.id || '';
    if (!employeeId) {
      this.error.set('Employee ID is missing');
      return;
    }

    this.apiService.updateEmployee(employeeId, { isActive: newStatus } as any).subscribe({
      next: () => {
        this.loadEmployees();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update employee status');
      }
    });
  }
}
