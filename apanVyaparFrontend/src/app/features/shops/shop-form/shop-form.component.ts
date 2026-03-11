import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Shop, CreateShopRequest } from '../../../core/models';

@Component({
  selector: 'app-shop-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './shop-form.component.html',
  styleUrl: './shop-form.component.css'
})
export class ShopFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  shopForm!: FormGroup;
  loading = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  shopId: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.shopId = this.route.snapshot.paramMap.get('id');
    
    if (this.shopId) {
      this.isEditMode.set(true);
      this.loadShop();
    } else {
      this.loading.set(false);
    }
  }

  private initForm(): void {
    this.shopForm = this.fb.group({
      shopName: ['', Validators.required],
      shopDescription: [''],
      shopCategory: [''],
      shopType: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['', Validators.required],
      latitude: [''],
      longitude: [''],
      businessHoursStart: [''],
      businessHoursEnd: [''],
      establishedYear: [''],
      bankAccountHolderName: [''],
      bankAccountNumber: [''],
      bankName: [''],
      bankBranchCode: [''],
      bankIfscCode: [''],
      upiId: ['']
    });
  }

  private loadShop(): void {
    if (!this.shopId) return;

    this.apiService.getShop(this.shopId).subscribe({
      next: (response) => {
        const shop = response.data;
        if (shop) {
          this.shopForm.patchValue(shop);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load shop');
        this.loading.set(false);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.shopForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  onSubmit(): void {
    if (this.shopForm.invalid) {
      Object.keys(this.shopForm.controls).forEach(key => {
        this.shopForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const shopData: CreateShopRequest = this.shopForm.value;

    if (this.isEditMode() && this.shopId) {
      this.apiService.updateShop(this.shopId, shopData).subscribe({
        next: () => {
          this.router.navigate(['/shops']);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update shop');
          this.submitting.set(false);
        }
      });
    } else {
      this.apiService.createShop(shopData).subscribe({
        next: () => {
          this.router.navigate(['/shops']);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create shop');
          this.submitting.set(false);
        }
      });
    }
  }
}
