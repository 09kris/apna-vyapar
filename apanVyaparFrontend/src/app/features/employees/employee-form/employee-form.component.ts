import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Employee, Shop, CreateEmployeeRequest, EmployeeField, FormFieldConfig } from '../../../core/models';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Form data
  employee = signal<Partial<Employee>>({});
  shops = signal<Shop[]>([]);
  
  // Field configuration from settings
  fieldConfig = signal<EmployeeField[]>([]);
  
  // Default fields if no configuration exists
  defaultFields: EmployeeField[] = [
    { key: 'employeeCode', label: 'Employee Code', type: 'text', enabled: true, required: false },
    { key: 'designation', label: 'Designation', type: 'select', enabled: true, required: true },
    { key: 'department', label: 'Department', type: 'text', enabled: true, required: false },
    { key: 'employmentType', label: 'Employment Type', type: 'select', enabled: true, required: false },
    { key: 'employeeType', label: 'Employee Type', type: 'select', enabled: true, required: false },
    { key: 'salary', label: 'Salary', type: 'number', enabled: true, required: false },
    { key: 'joiningDate', label: 'Joining Date', type: 'date', enabled: true, required: false },
    { key: 'probationEndDate', label: 'Probation End Date', type: 'date', enabled: true, required: false },
    { key: 'reportingTo', label: 'Reporting To', type: 'text', enabled: true, required: false },
    { key: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', enabled: true, required: false },
    { key: 'panNumber', label: 'PAN Number', type: 'text', enabled: true, required: false },
    { key: 'bankAccount', label: 'Bank Account', type: 'text', enabled: true, required: false },
    { key: 'bankIfsc', label: 'Bank IFSC', type: 'text', enabled: true, required: false },
    { key: 'emergencyContact', label: 'Emergency Contact', type: 'text', enabled: true, required: false },
    { key: 'emergencyContactName', label: 'Emergency Contact Name', type: 'text', enabled: true, required: false },
  ];

  // Form fields - User details (filled by shop owner)
  formData = signal<Partial<CreateEmployeeRequest>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '', // Add password field
    // Employee details
    employeeCode: '',
    designation: '',
    department: '',
    employmentType: 'FULL_TIME',
    employeeType: 'Worker',
    salary: 0,
    joiningDate: new Date(),
    probationEndDate: undefined,
    reportingTo: '',
    aadhaarNumber: '',
    panNumber: '',
    bankAccount: '',
    bankIfsc: '',
    emergencyContact: '',
    emergencyContactName: ''
  });

  // UI state
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Mode
  isEditMode = signal(false);
  employeeId = signal<string>('');

  // Employment types
  employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT'];

  // Employee types (Worker/Manager)
  employeeTypes = ['Worker', 'Manager'];

  // Designation types
  designationTypes = ['Manager', 'Worker', 'Two in One'];

  // Shop selection
  selectedShopId = signal<string>('');
  
  // Password fields (only for new employees)
  confirmPassword = '';

  ngOnInit(): void {
    this.loadShops();
    
    this.route.queryParams.subscribe(params => {
      if (params['shopId']) {
        this.selectedShopId.set(params['shopId']);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'add') {
      this.isEditMode.set(true);
      this.employeeId.set(id);
      this.loadEmployee(id);
    }
    // Note: loading.set(false) is handled in loadFieldConfiguration() or loadEmployee()
  }

  // Helper to check if a field is enabled
  isFieldEnabled(fieldKey: string): boolean {
    const config = this.fieldConfig();
    if (config.length === 0) {
      // Use defaults if no config loaded
      const defaultField = this.defaultFields.find(f => f.key === fieldKey);
      return defaultField ? defaultField.enabled : true;
    }
    const field = config.find(f => f.key === fieldKey);
    return field ? field.enabled : false;
  }

  // Helper to check if a field is required
  isFieldRequired(fieldKey: string): boolean {
    const config = this.fieldConfig();
    if (config.length === 0) {
      // Use defaults if no config loaded
      const defaultField = this.defaultFields.find(f => f.key === fieldKey);
      return defaultField ? (defaultField.required ?? false) : false;
    }
    const field = config.find(f => f.key === fieldKey);
    return field ? (field.required ?? false) : false;
  }

  loadFieldConfiguration(): void {
    const shopId = this.selectedShopId();
    console.log('[EmployeeForm] Loading field configuration for shop:', shopId);
    
    if (!shopId) {
      // Use default configuration
      console.log('[EmployeeForm] No shop selected, using default fields');
      this.fieldConfig.set([...this.defaultFields]);
      this.loading.set(false);
      return;
    }

    this.apiService.getEmployeeFieldConfiguration(shopId).subscribe({
      next: (response) => {
        console.log('[EmployeeForm] Field configuration loaded:', response);
        
        // Handle both JSON string and parsed array formats
        let fields: EmployeeField[] = [];
        if (response.data && response.data.fields) {
          // Normalize fields to EmployeeField[] regardless of format
          let raw: any[] = [];
          if (typeof response.data.fields === 'string') {
            try {
              raw = JSON.parse(response.data.fields);
              console.log('[EmployeeForm] Parsed fields from JSON string:', raw);
            } catch (e) {
              console.log('[EmployeeForm] Failed to parse fields JSON string, using defaults');
            }
          } else if (Array.isArray(response.data.fields)) {
            raw = response.data.fields;
          }
          // map to EmployeeField, defaulting required to false
          fields = raw.map(r => ({
            key: r.key,
            label: r.label,
            type: r.type,
            enabled: r.enabled,
            required: !!r.required
          }));
        }
        
        if (fields.length > 0) {
          this.fieldConfig.set(fields);
          console.log('[EmployeeForm] Fields set from config:', fields);
        } else {
          // Use defaults if no config found or parsing failed
          console.log('[EmployeeForm] No config found or invalid, using default fields');
          this.fieldConfig.set([...this.defaultFields]);
        }
        // Only set loading to false after field config is loaded
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[EmployeeForm] Error loading field configuration:', err);
        // Use defaults on error
        this.fieldConfig.set([...this.defaultFields]);
        // Still set loading to false
        this.loading.set(false);
      }
    });
  }

  loadShops(): void {
    const userShops = this.authService.shops();
    
    if (userShops.length > 0) {
      this.shops.set(userShops);
      this.initializeShopSelection();
    } else {
      this.apiService.getShops().subscribe({
        next: (response) => {
          this.shops.set(response.data || []);
          this.initializeShopSelection();
        },
        error: (err) => {
          console.error('Failed to load shops:', err);
          this.error.set('Failed to load shops');
        }
      });
    }
  }

  initializeShopSelection(): void {
    const queryShopId = this.route.snapshot.queryParams['shopId'];
    const authSelectedShopId = this.authService.selectedShopId();

    if (queryShopId) {
      this.selectedShopId.set(queryShopId);
    } else if (authSelectedShopId) {
      this.selectedShopId.set(authSelectedShopId);
    } else if (this.shops().length > 0) {
      this.selectedShopId.set(this.shops()[0].shopId);
    }
    
    // Always load field configuration, even if no shop is selected
    // (it will use defaults if no shop is available)
    this.loadFieldConfiguration();
  }

  loadEmployee(id: string): void {
    this.apiService.getEmployee(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.employee.set(response.data);
          
          // Extract userId from the employee data
          const userId = response.data.userId;
          
          this.formData.set({
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            employeeCode: response.data.employeeCode || '',
            designation: response.data.designation || '',
            department: response.data.department || '',
            employmentType: response.data.employmentType || 'FULL_TIME',
            employeeType: response.data.employeeType || 'Worker',
            salary: response.data.salary || 0,
            joiningDate: response.data.joiningDate ? new Date(response.data.joiningDate) : new Date(),
            probationEndDate: response.data.probationEndDate ? new Date(response.data.probationEndDate) : undefined,
            reportingTo: response.data.reportingTo || '',
            aadhaarNumber: response.data.aadhaarNumber || '',
            panNumber: response.data.panNumber || '',
            bankAccount: response.data.bankAccount || '',
            bankIfsc: response.data.bankIfsc || '',
            emergencyContact: response.data.emergencyContact || '',
            emergencyContactName: response.data.emergencyContactName || '',
            userId: userId || undefined
          });
          
          if (response.data.shopId) {
            this.selectedShopId.set(response.data.shopId);
          }
          
          // Store userId for later use in update operations
          if (response.data.userId) {
            (this.formData() as any).userId = response.data.userId;
          }
        }
        // Load field configuration after employee is loaded
        this.loadFieldConfiguration();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load employee');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    this.error.set(null);
    this.successMessage.set(null);
    
    if (!this.selectedShopId()) {
      this.error.set('Please select a shop');
      return;
    }

    // Validate required user details
    if (!this.formData().firstName) {
      this.error.set('First name is required');
      return;
    }

    if (!this.formData().lastName) {
      this.error.set('Last name is required');
      return;
    }

    if (!this.formData().email) {
      this.error.set('Email is required');
      return;
    }

    if (!this.formData().phone) {
      this.error.set('Phone number is required');
      return;
    }
    
    // Validate password for new employees
    if (!this.isEditMode()) {
      const password = this.formData().password;
      if (!password) {
        this.error.set('Password is required');
        return;
      }
      if (password !== this.confirmPassword) {
        this.error.set('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        this.error.set('Password must be at least 6 characters');
        return;
      }
    }

    if (!this.formData().designation) {
      this.error.set('Designation is required');
      return;
    }

    // Validate required fields based on configuration
    if (this.isFieldEnabled('employeeCode') && this.isFieldRequired('employeeCode') && !this.formData().employeeCode) {
      this.error.set('Employee Code is required');
      return;
    }

    if (this.isFieldEnabled('department') && this.isFieldRequired('department') && !this.formData().department) {
      this.error.set('Department is required');
      return;
    }

    if (this.isFieldEnabled('salary') && this.isFieldRequired('salary') && !this.formData().salary) {
      this.error.set('Salary is required');
      return;
    }

    this.saving.set(true);

    const data = {
      ...this.formData(),
      shopId: this.selectedShopId(),
      joiningDate: this.formData().joiningDate ? new Date(this.formData().joiningDate!).toISOString() : undefined,
      probationEndDate: this.formData().probationEndDate ? new Date(this.formData().probationEndDate!).toISOString() : undefined
    };

    if (this.isEditMode()) {
      this.apiService.updateEmployee(this.employeeId(), data as any).subscribe({
        next: (response) => {
          this.saving.set(false);
          this.successMessage.set('Employee updated successfully');
          setTimeout(() => {
            this.router.navigate(['/employees'], { queryParams: { shopId: this.selectedShopId() } });
          }, 1500);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'Failed to update employee');
        }
      });
    } else {
      this.apiService.createEmployee(this.selectedShopId(), data as any).subscribe({
        next: (response) => {
          this.saving.set(false);
          this.successMessage.set('Employee created successfully');
          setTimeout(() => {
            this.router.navigate(['/employees'], { queryParams: { shopId: this.selectedShopId() } });
          }, 1500);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'Failed to create employee');
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/employees'], { queryParams: { shopId: this.selectedShopId() } });
  }

  onShopChange(shopId: string): void {
    this.selectedShopId.set(shopId);
    this.authService.setSelectedShop(shopId);
    this.loadFieldConfiguration();
  }
}
