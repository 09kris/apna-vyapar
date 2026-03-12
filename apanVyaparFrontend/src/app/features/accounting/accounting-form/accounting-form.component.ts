import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../../core/services/accounting.service';
import { CreateAccountingRequest } from '../../../core/models';

@Component({
  selector: 'app-accounting-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './accounting-form.component.html',
  styleUrls: ['./accounting-form.component.css']
})
export class AccountingFormComponent implements OnInit {
  private accountingService = inject(AccountingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  shopId = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');

  // Form data
  transactionType = signal<string>('INCOME');
  category = signal<string>('');
  amount = signal<number>(0);
  description = signal<string>('');
  paymentMode = signal<string>('');
  transactionDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Categories based on transaction type
  incomeCategories: { value: string; label: string }[] = [
    { value: 'SALES', label: 'Sales' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'OTHER_INCOME', label: 'Other Income' }
  ];

  expenseCategories: { value: string; label: string }[] = [
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

  paymentModes = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CARD', label: 'Card' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'OTHER', label: 'Other' }
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['shopId']) {
        this.shopId.set(params['shopId']);
      }
    });
  }

  onTransactionTypeChange(): void {
    this.category.set('');
  }

  get currentCategories(): { value: string; label: string }[] {
    return this.transactionType() === 'INCOME' ? this.incomeCategories : this.expenseCategories;
  }

  onSubmit(): void {
    // Validate
    if (!this.category()) {
      this.error.set('Please select a category');
      return;
    }
    if (!this.amount() || this.amount() <= 0) {
      this.error.set('Please enter a valid amount');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const data: CreateAccountingRequest = {
      // API expects entryType/entryDate terminology
      entryType: this.transactionType() as 'INCOME' | 'EXPENSE',
      category: this.category(),
      amount: this.amount(),
      description: this.description() || undefined,
      paymentMethod: this.paymentMode() as any || undefined,
      entryDate: this.transactionDate() ? new Date(this.transactionDate()).toISOString() : new Date().toISOString(),
      shopId: this.shopId()
    };

    this.accountingService.createAccountingEntry(this.shopId(), data).subscribe({
      next: (res) => {
        if (res.success) {
          this.success.set('Transaction added successfully!');
          setTimeout(() => {
            this.router.navigate(['/accounting'], { queryParams: { shopId: this.shopId() } });
          }, 1500);
        } else {
          this.error.set(res.message || 'Failed to add transaction');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to add transaction');
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/accounting'], { queryParams: { shopId: this.shopId() } });
  }
}

