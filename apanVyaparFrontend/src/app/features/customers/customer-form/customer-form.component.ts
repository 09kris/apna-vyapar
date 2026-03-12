import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShopCustomer, CreateCustomerRequest } from '../../../core/models';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css'
})
export class CustomerFormComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  customerId = signal<string | null>(null);
  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  selectedShopId = this.authService.selectedShopId;

  // Form data
  formData = signal<CreateCustomerRequest>({
    customerType: 'RETAIL',
    fullName: '',
    phone: '',
    email: '',
    companyName: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    creditLimit: 0
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId.set(id);
      this.isEditMode.set(true);
      this.loadCustomer(id);
    }
  }

  loadCustomer(id: string): void {
    this.loading.set(true);
    this.apiService.getCustomer(id).subscribe({
      next: (response) => {
        if (response.data) {
          const customer = response.data;
          this.formData.set({
            customerType: customer.customerType || 'RETAIL',
            fullName: customer.fullName || '',
            phone: customer.phone || '',
            email: customer.email || '',
            companyName: customer.companyName || '',
            gstNumber: customer.gstNumber || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            creditLimit: customer.creditLimit || 0
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.error.set('Failed to load customer data');
        this.loading.set(false);
      }
    });
  }

  updateField(field: keyof CreateCustomerRequest, value: any): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    const shopId = this.selectedShopId();
    if (!shopId) {
      this.error.set('No shop selected');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const data = {
      ...this.formData(),
      referralCodeUsed: 'DEFAULT' // Default referral code
    };

    if (this.isEditMode() && this.customerId()) {
      this.apiService.updateCustomer(this.customerId()!, data).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          console.error('Error updating customer:', error);
          this.error.set('Failed to update customer');
          this.saving.set(false);
        }
      });
    } else {
      this.apiService.addCustomer(shopId, data).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          console.error('Error creating customer:', error);
          this.error.set('Failed to create customer');
          this.saving.set(false);
        }
      });
    }
  }

  validateForm(): boolean {
    const data = this.formData();
    
    if (!data.fullName?.trim()) {
      this.error.set('Full name is required');
      return false;
    }
    
    if (!data.phone?.trim()) {
      this.error.set('Phone number is required');
      return false;
    }
    
    if (!data.customerType) {
      this.error.set('Customer type is required');
      return false;
    }

    if (data.email && !this.isValidEmail(data.email)) {
      this.error.set('Please enter a valid email address');
      return false;
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  cancel(): void {
    this.router.navigate(['/customers']);
  }
}
