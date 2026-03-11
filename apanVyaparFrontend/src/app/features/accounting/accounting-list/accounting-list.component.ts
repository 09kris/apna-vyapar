import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../../core/services/accounting.service';
import { Accounting, AccountingDashboard } from '../../../core/models';

@Component({
  selector: 'app-accounting-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './accounting-list.component.html',
  styleUrls: ['./accounting-list.component.css']
})
export class AccountingListComponent implements OnInit {
  private accountingService = inject(AccountingService);
  private route = inject(ActivatedRoute);

  // Expose Math for template
  Math = Math;

  shopId = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');
  
  // Dashboard data
  dashboard = signal<AccountingDashboard | null>(null);
  
  // List data
  transactions = signal<Accounting[]>([]);
  total = signal<number>(0);
  page = signal<number>(1);
  limit = signal<number>(20);
  totalPages = signal<number>(0);

  // Filters
  transactionTypeFilter = signal<string>('');
  categoryFilter = signal<string>('');
  startDateFilter = signal<string>('');
  endDateFilter = signal<string>('');

  // Categories for dropdown
  incomeCategories = [
    { value: 'SALES', label: 'Sales' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'OTHER_INCOME', label: 'Other Income' }
  ];

  expenseCategories = [
    { value: 'SALARY', label: 'Salary' },
    { value: 'RENT', label: 'Rent' },
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'SUPPLIES', label: 'Supplies' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'TAX', label: 'Tax' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'INTEREST', label: 'Interest' },
    { value: 'OTHER_EXPENSE', label: 'Other Expense' }
  ];

  ngOnInit(): void {
    // Get shopId from route query params
    this.route.queryParams.subscribe(params => {
      if (params['shopId']) {
        this.shopId.set(params['shopId']);
        this.loadDashboard();
        this.loadTransactions();
      }
    });
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.accountingService.getAccountingDashboard(this.shopId(), 30).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dashboard.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load dashboard');
        this.loading.set(false);
      }
    });
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.accountingService.getAccountingEntries(
      this.shopId(),
      this.page(),
      this.limit(),
      {
        transactionType: this.transactionTypeFilter() || undefined,
        category: this.categoryFilter() || undefined,
        startDate: this.startDateFilter() || undefined,
        endDate: this.endDateFilter() || undefined
      }
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.transactions.set(res.data.items);
          this.total.set(res.data.total);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load transactions');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadTransactions();
  }

  clearFilters(): void {
    this.transactionTypeFilter.set('');
    this.categoryFilter.set('');
    this.startDateFilter.set('');
    this.endDateFilter.set('');
    this.page.set(1);
    this.loadTransactions();
  }

  goToPage(pageNum: number): void {
    if (pageNum >= 1 && pageNum <= this.totalPages()) {
      this.page.set(pageNum);
      this.loadTransactions();
    }
  }

  deleteTransaction(id: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.accountingService.deleteAccountingEntry(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadTransactions();
            this.loadDashboard();
          }
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to delete transaction');
        }
      });
    }
  }

  getCategoryLabel(category: string): string {
    const allCategories = [...this.incomeCategories, ...this.expenseCategories];
    const found = allCategories.find(c => c.value === category);
    return found ? found.label : category;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

