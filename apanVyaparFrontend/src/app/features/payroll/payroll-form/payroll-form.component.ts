import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Employee, Shop, PayrollDetails } from '../../../core/models';

@Component({
  selector: 'app-payroll-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './payroll-form.component.html',
  styleUrl: './payroll-form.component.css'
})
export class PayrollFormComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mode = signal<string>('create');
  payrollId = signal<string>('');
  shopId = signal<string>('');
  
  shops = signal<Shop[]>([]);
  employees = signal<Employee[]>([]);
  payroll = signal<PayrollDetails | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  selectedEmployeeId = signal<string>('');
  salaryMonth = signal<string>('');
  
  basicSalary = signal<number>(0);
  hra = signal<number>(0);
  medicalAllowance = signal<number>(0);
  transportAllowance = signal<number>(0);
  otherAllowances = signal<number>(0);
  overtimeAmount = signal<number>(0);
  bonus = signal<number>(0);
  
  pfDeduction = signal<number>(0);
  taxDeduction = signal<number>(0);
  loanDeduction = signal<number>(0);
  otherDeductions = signal<number>(0);
  
  workingDays = signal<number>(30);
  leaveDays = signal<number>(0);
  overtimeHours = signal<number>(0);
  
  paymentDate = signal<string>('');
  paymentMode = signal<string>('CASH');
  paymentReference = signal<string>('');

  grossSalary = signal<number>(0);
  totalDeductions = signal<number>(0);
  netSalary = signal<number>(0);

  ngOnInit(): void {
    this.initializeFromRoute();
  }

  initializeFromRoute(): void {
    this.route.queryParams.subscribe(params => {
      if (params['shopId']) {
        this.shopId.set(params['shopId']);
      }
      if (params['mode']) {
        this.mode.set(params['mode']);
      }
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.payrollId.set(params['id']);
        if (this.mode() === 'create') {
          this.mode.set('view');
        }
      }
    });

    this.loadShops();
  }

  loadShops(): void {
    const userShops = this.authService.shops();
    
    if (userShops.length > 0) {
      this.shops.set(userShops);
      if (!this.shopId() && userShops.length > 0) {
        this.shopId.set(userShops[0].shopId);
      }
      this.loadEmployees();
    } else {
      this.apiService.getShops().subscribe({
        next: (response) => {
          this.shops.set(response.data || []);
          if (this.shops().length > 0 && !this.shopId()) {
            this.shopId.set(this.shops()[0].shopId);
          }
          this.loadEmployees();
        },
        error: () => {
          this.error.set('Failed to load shops');
          this.loading.set(false);
        }
      });
    }
  }

  loadEmployees(): void {
    const sid = this.shopId();
    if (!sid) return;

    this.apiService.getEmployees(sid, 1, 100).subscribe({
      next: (response) => {
        this.employees.set(response.data.items || []);
        
        if (this.payrollId()) {
          this.loadPayroll();
        } else {
          this.loading.set(false);
          this.setDefaultSalaryMonth();
        }
      },
      error: () => {
        this.error.set('Failed to load employees');
        this.loading.set(false);
      }
    });
  }

  setDefaultSalaryMonth(): void {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.salaryMonth.set(month);
  }

  loadPayroll(): void {
    const pid = this.payrollId();
    if (!pid) return;

    this.apiService.getPayroll(pid).subscribe({
      next: (response) => {
        const payrollData = response.data as PayrollDetails;
        if (!payrollData) {
          this.error.set('Payroll not found');
          this.loading.set(false);
          return;
        }
        
        this.payroll.set(payrollData);
        
        this.selectedEmployeeId.set(payrollData.employeeId);
        this.salaryMonth.set(payrollData.salaryMonth || '');
        
        this.basicSalary.set(Number(payrollData.basicSalary));
        this.hra.set(Number(payrollData.hra) || 0);
        this.medicalAllowance.set(Number(payrollData.medicalAllowance) || 0);
        this.transportAllowance.set(Number(payrollData.transportAllowance) || 0);
        this.otherAllowances.set(Number(payrollData.otherAllowances) || 0);
        this.overtimeAmount.set(Number(payrollData.overtimeAmount) || 0);
        this.bonus.set(Number(payrollData.bonus) || 0);
        
        this.pfDeduction.set(Number(payrollData.pfDeduction) || 0);
        this.taxDeduction.set(Number(payrollData.taxDeduction) || 0);
        this.loanDeduction.set(Number(payrollData.loanDeduction) || 0);
        this.otherDeductions.set(Number(payrollData.otherDeductions) || 0);
        
        this.workingDays.set(payrollData.workingDays || 30);
        this.leaveDays.set(Number(payrollData.leaveDays) || 0);
        this.overtimeHours.set(Number(payrollData.overtimeHours) || 0);
        
        this.paymentMode.set(payrollData.paymentMode || 'CASH');
        this.paymentReference.set(payrollData.paymentReference || '');
        
        this.calculateTotals();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load payroll details');
        this.loading.set(false);
      }
    });
  }

  onShopChange(): void {
    this.loadEmployees();
  }

  onEmployeeChange(): void {
    const empId = this.selectedEmployeeId();
    const employee = this.employees().find(e => (e as any).employeeId === empId);
    
    if (employee && employee.salary) {
      this.basicSalary.set(employee.salary);
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    const gross = 
      this.basicSalary() + 
      this.hra() + 
      this.medicalAllowance() + 
      this.transportAllowance() + 
      this.otherAllowances() + 
      this.overtimeAmount() + 
      this.bonus();
    
    const deductions = 
      this.pfDeduction() + 
      this.taxDeduction() + 
      this.loanDeduction() + 
      this.otherDeductions();
    
    this.grossSalary.set(gross);
    this.totalDeductions.set(deductions);
    this.netSalary.set(gross - deductions);
  }

  onFieldChange(): void {
    this.calculateTotals();
  }

  generatePayroll(): void {
    if (!this.validateForm()) return;

    this.saving.set(true);
    this.error.set(null);

    const payrollData = {
      employeeId: this.selectedEmployeeId(),
      salaryMonth: this.salaryMonth(),
      basicSalary: this.basicSalary(),
      hra: this.hra(),
      medicalAllowance: this.medicalAllowance(),
      transportAllowance: this.transportAllowance(),
      otherAllowances: this.otherAllowances(),
      pfDeduction: this.pfDeduction(),
      taxDeduction: this.taxDeduction(),
      loanDeduction: this.loanDeduction(),
      otherDeductions: this.otherDeductions(),
      workingDays: this.workingDays(),
      leaveDays: this.leaveDays(),
      overtimeHours: this.overtimeHours(),
      overtimeAmount: this.overtimeAmount(),
      bonus: this.bonus(),
    };

    this.apiService.createPayroll(this.shopId(), payrollData).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Payroll generated successfully!');
        setTimeout(() => {
          this.router.navigate(['/payroll'], { queryParams: { shopId: this.shopId() } });
        }, 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to generate payroll');
      }
    });
  }

  markAsPaid(): void {
    if (!this.payrollId()) return;

    this.saving.set(true);
    this.error.set(null);

    const paymentData = {
      paymentStatus: 'PAID',
      paymentDate: this.paymentDate() || new Date().toISOString(),
      paymentMode: this.paymentMode(),
      paymentReference: this.paymentReference(),
    };

    this.apiService.updatePayrollPaymentStatus(this.payrollId(), paymentData).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Payment status updated successfully!');
        setTimeout(() => {
          this.router.navigate(['/payroll'], { queryParams: { shopId: this.shopId() } });
        }, 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to update payment status');
      }
    });
  }

  validateForm(): boolean {
    if (!this.selectedEmployeeId()) {
      this.error.set('Please select an employee');
      return false;
    }
    if (!this.salaryMonth()) {
      this.error.set('Please select a salary month');
      return false;
    }
    if (!this.basicSalary() || this.basicSalary() <= 0) {
      this.error.set('Please enter basic salary');
      return false;
    }
    if (!this.workingDays() || this.workingDays() <= 0) {
      this.error.set('Please enter working days');
      return false;
    }
    return true;
  }

  goBack(): void {
    this.router.navigate(['/payroll'], { queryParams: { shopId: this.shopId() } });
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

  getEmployeeName(empId: string): string {
    const employee = this.employees().find(e => (e as any).employeeId === empId);
    if (employee) {
      return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    }
    return 'N/A';
  }
}

