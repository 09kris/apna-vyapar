import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="complete-profile-container">
      <div class="complete-profile-box">
        <div class="complete-profile-header">
          <h1 class="logo">Complete Your Shop Profile</h1>
          <p class="subtitle">Please provide your business details</p>
        </div>
        
        <form class="complete-profile-form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="businessName">Business Name *</label>
            <input 
              type="text" 
              id="businessName" 
              [(ngModel)]="businessName" 
              name="businessName"
              placeholder="Enter your business name"
              required
            >
          </div>

          <div class="form-group">
            <label for="businessType">Business Type</label>
            <select 
              id="businessType" 
              [(ngModel)]="businessType" 
              name="businessType"
            >
              <option value="">Select business type</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="SERVICES">Services</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="businessRegistrationNumber">Business Registration Number</label>
            <input 
              type="text" 
              id="businessRegistrationNumber" 
              [(ngModel)]="businessRegistrationNumber" 
              name="businessRegistrationNumber"
              placeholder="Enter registration number"
            >
          </div>

          <div class="form-group">
            <label for="taxIdentificationNumber">Tax Identification Number (TIN)</label>
            <input 
              type="text" 
              id="taxIdentificationNumber" 
              [(ngModel)]="taxIdentificationNumber" 
              name="taxIdentificationNumber"
              placeholder="Enter TIN"
            >
          </div>

          <div class="form-group">
            <label for="businessAddress">Business Address</label>
            <textarea 
              id="businessAddress" 
              [(ngModel)]="businessAddress" 
              name="businessAddress"
              placeholder="Enter your business address"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="businessCity">City</label>
              <input 
                type="text" 
                id="businessCity" 
                [(ngModel)]="businessCity" 
                name="businessCity"
                placeholder="City"
              >
            </div>
            
            <div class="form-group">
              <label for="businessState">State</label>
              <input 
                type="text" 
                id="businessState" 
                [(ngModel)]="businessState" 
                name="businessState"
                placeholder="State"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="businessZipCode">Zip Code</label>
              <input 
                type="text" 
                id="businessZipCode" 
                [(ngModel)]="businessZipCode" 
                name="businessZipCode"
                placeholder="Zip Code"
              >
            </div>
            
            <div class="form-group">
              <label for="businessPhone">Business Phone</label>
              <input 
                type="tel" 
                id="businessPhone" 
                [(ngModel)]="businessPhone" 
                name="businessPhone"
                placeholder="Phone number"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="businessEmail">Business Email</label>
            <input 
              type="email" 
              id="businessEmail" 
              [(ngModel)]="businessEmail" 
              name="businessEmail"
              placeholder="business@email.com"
            >
          </div>

          <div class="form-group">
            <label for="businessWebsite">Business Website</label>
            <input 
              type="url" 
              id="businessWebsite" 
              [(ngModel)]="businessWebsite" 
              name="businessWebsite"
              placeholder="https://yourwebsite.com"
            >
          </div>

          <h3 class="section-title">Bank Details (Optional)</h3>

          <div class="form-group">
            <label for="bankAccountHolderName">Account Holder Name</label>
            <input 
              type="text" 
              id="bankAccountHolderName" 
              [(ngModel)]="bankAccountHolderName" 
              name="bankAccountHolderName"
              placeholder="Name as per bank account"
            >
          </div>

          <div class="form-group">
            <label for="bankAccountNumber">Account Number</label>
            <input 
              type="text" 
              id="bankAccountNumber" 
              [(ngModel)]="bankAccountNumber" 
              name="bankAccountNumber"
              placeholder="Bank account number"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="bankBranchCode">Branch Code</label>
              <input 
                type="text" 
                id="bankBranchCode" 
                [(ngModel)]="bankBranchCode" 
                name="bankBranchCode"
                placeholder="Branch code"
              >
            </div>
            
            <div class="form-group">
              <label for="bankIfscCode">IFSC Code</label>
              <input 
                type="text" 
                id="bankIfscCode" 
                [(ngModel)]="bankIfscCode" 
                name="bankIfscCode"
                placeholder="IFSC code"
              >
            </div>
          </div>
          
          <div class="error-message" *ngIf="error()">
            {{ error() }}
          </div>

          <div class="success-message" *ngIf="success()">
            {{ success() }}
          </div>
          
          <button type="submit" class="submit-btn" [disabled]="isLoading()">
            <span *ngIf="!isLoading()">Complete Profile</span>
            <span *ngIf="isLoading()">Saving...</span>
          </button>
        </form>
        
        <div class="skip-footer">
          <p>Skip for now? <a (click)="skipProfile()">Go to Dashboard</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .complete-profile-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .complete-profile-box {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .complete-profile-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #3b82f6;
      margin: 0 0 10px 0;
    }

    .subtitle {
      color: #64748b;
      margin: 0;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #1e293b;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-row {
      display: flex;
      gap: 15px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 30px 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }

    .error-message {
      background: #fee2e2;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }

    .success-message {
      background: #dcfce7;
      color: #16a34a;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }

    .submit-btn {
      width: 100%;
      padding: 14px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .skip-footer {
      text-align: center;
      margin-top: 20px;
      color: #64748b;
    }

    .skip-footer a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
    }

    .skip-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class CompleteProfileComponent {
  // Business Details
  businessName = '';
  businessType = '';
  businessRegistrationNumber = '';
  taxIdentificationNumber = '';
  businessAddress = '';
  businessCity = '';
  businessState = '';
  businessZipCode = '';
  businessPhone = '';
  businessEmail = '';
  businessWebsite = '';

  // Bank Details
  bankAccountHolderName = '';
  bankAccountNumber = '';
  bankBranchCode = '';
  bankIfscCode = '';
  
  isLoading = signal(false);
  error = signal('');
  success = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.businessName) {
      this.error.set('Business name is required');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.success.set('');

    // Build shop owner profile data
    const profileData = {
      businessName: this.businessName,
      businessType: this.businessType || undefined,
      businessRegistrationNumber: this.businessRegistrationNumber || undefined,
      taxIdentificationNumber: this.taxIdentificationNumber || undefined,
      businessAddress: this.businessAddress || undefined,
      businessCity: this.businessCity || undefined,
      businessState: this.businessState || undefined,
      businessZipCode: this.businessZipCode || undefined,
      businessPhone: this.businessPhone || undefined,
      businessEmail: this.businessEmail || undefined,
      businessWebsite: this.businessWebsite || undefined,
      bankAccountHolderName: this.bankAccountHolderName || undefined,
      bankAccountNumber: this.bankAccountNumber || undefined,
      bankBranchCode: this.bankBranchCode || undefined,
      bankIfscCode: this.bankIfscCode || undefined,
    };

    this.authService.completeShopOwnerProfile(profileData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        if (response.success) {
          this.success.set('Shop profile completed successfully!');
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        } else {
          this.error.set(response.message);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Failed to complete profile. Please try again.');
      }
    });
  }

  skipProfile() {
    this.router.navigate(['/dashboard']);
  }
}
