import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface EmployeeField {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
  required: boolean;
}

interface ProductField {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
}

interface ShopField {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  activeTab = signal<'employee-fields' | 'product-fields' | 'shop-fields' | 'general'>('employee-fields');
  isLoading = signal(false);
  isSaving = signal(false);
  isLoadingShop = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Local shop selection for settings page
  shops = this.authService.shops;
  selectedShopId = signal<string>('');
  isShopOwned = signal<boolean>(true);

  // Public view toggle state
  publicViewEnabled = signal<boolean>(false);
  isLoadingPublicView = signal<boolean>(false);
  isTogglingPublicView = signal<boolean>(false);

  // Available employee fields that can be configured
  availableFields: EmployeeField[] = [
    { key: 'employeeCode', label: 'Employee Code', type: 'text', enabled: true, required: false },
    { key: 'designation', label: 'Designation', type: 'text', enabled: true, required: true },
    { key: 'department', label: 'Department', type: 'text', enabled: true, required: false },
    { key: 'employmentType', label: 'Employment Type', type: 'select', enabled: true, required: false },
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

  // Available product fields that can be configured
  availableProductFields: ProductField[] = [
    { key: 'productCode', label: 'Product Code', type: 'text', enabled: true },
    { key: 'description', label: 'Description', type: 'textarea', enabled: true },
    { key: 'brand', label: 'Brand', type: 'text', enabled: true },
    { key: 'manufacturer', label: 'Manufacturer', type: 'text', enabled: true },
    { key: 'costPrice', label: 'Cost Price', type: 'number', enabled: true },
    { key: 'mrp', label: 'MRP', type: 'number', enabled: true },
    { key: 'discountPercentage', label: 'Discount (%)', type: 'number', enabled: true },
    { key: 'taxPercentage', label: 'Tax (%)', type: 'number', enabled: true },
    { key: 'stockQuantity', label: 'Stock Quantity', type: 'number', enabled: true },
    { key: 'reorderLevel', label: 'Reorder Level', type: 'number', enabled: true },
    { key: 'maxStockLevel', label: 'Max Stock Level', type: 'number', enabled: true },
    { key: 'weight', label: 'Weight', type: 'number', enabled: true },
    { key: 'dimensions', label: 'Dimensions', type: 'text', enabled: true },
    { key: 'imageUrl', label: 'Image URL', type: 'text', enabled: true },
    { key: 'isFeatured', label: 'Featured Product', type: 'checkbox', enabled: true },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date', enabled: true },
    { key: 'batchNumber', label: 'Batch Number', type: 'text', enabled: true },
    { key: 'warrantyMonths', label: 'Warranty (Months)', type: 'number', enabled: true },
    { key: 'returnDays', label: 'Return Days', type: 'number', enabled: true },
  ];

  // Available shop fields that can be configured
  availableShopFields: ShopField[] = [
    { key: 'shopName', label: 'Shop Name', type: 'text', enabled: true },
    { key: 'shopDescription', label: 'Description', type: 'textarea', enabled: true },
    { key: 'shopCategory', label: 'Category', type: 'text', enabled: true },
    { key: 'shopType', label: 'Shop Type', type: 'select', enabled: true },
    { key: 'shopLogo', label: 'Logo', type: 'text', enabled: true },
    { key: 'shopBanner', label: 'Banner', type: 'text', enabled: true },
    { key: 'phoneNumber', label: 'Phone Number', type: 'text', enabled: true },
    { key: 'email', label: 'Email', type: 'text', enabled: true },
    { key: 'website', label: 'Website', type: 'text', enabled: true },
    { key: 'address', label: 'Address', type: 'text', enabled: true },
    { key: 'city', label: 'City', type: 'text', enabled: true },
    { key: 'state', label: 'State', type: 'text', enabled: true },
    { key: 'zipCode', label: 'Zip Code', type: 'text', enabled: true },
    { key: 'country', label: 'Country', type: 'text', enabled: true },
    { key: 'latitude', label: 'Latitude', type: 'number', enabled: true },
    { key: 'longitude', label: 'Longitude', type: 'number', enabled: true },
    { key: 'businessHoursStart', label: 'Business Hours Start', type: 'text', enabled: true },
    { key: 'businessHoursEnd', label: 'Business Hours End', type: 'text', enabled: true },
    { key: 'establishedYear', label: 'Established Year', type: 'number', enabled: true },
    { key: 'bankAccountHolderName', label: 'Bank Account Holder', type: 'text', enabled: true },
    { key: 'bankAccountNumber', label: 'Bank Account Number', type: 'text', enabled: true },
    { key: 'bankName', label: 'Bank Name', type: 'text', enabled: true },
    { key: 'bankBranchCode', label: 'Bank Branch Code', type: 'text', enabled: true },
    { key: 'bankIfscCode', label: 'Bank IFSC Code', type: 'text', enabled: true },
    { key: 'upiId', label: 'UPI ID', type: 'text', enabled: true },
    { key: 'referenceCode', label: 'Reference Code', type: 'text', enabled: true },
    { key: 'referralCode', label: 'Referral Code', type: 'text', enabled: true },
    { key: 'publicView', label: 'Public View', type: 'checkbox', enabled: true },
  ];

  ngOnInit(): void {
    // Initialize selected shop from auth service
    const authSelectedShopId = this.authService.selectedShopId();
    if (authSelectedShopId) {
      this.selectedShopId.set(authSelectedShopId);
    } else if (this.shops().length > 0) {
      // Auto-select first shop if no shop is selected
      this.selectedShopId.set(this.shops()[0].shopId);
    }
    
    this.loadFieldConfiguration();
  }

  onShopChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedShopId.set(select.value);
    this.authService.setSelectedShop(select.value);
    this.loadFieldConfiguration();
  }

  setActiveTab(tab: 'employee-fields' | 'product-fields' | 'shop-fields' | 'general'): void {
    this.activeTab.set(tab);
    this.clearMessages();
    
    // Load configuration when switching to a tab
    if (tab === 'employee-fields') {
      this.loadEmployeeFieldConfiguration();
    } else if (tab === 'product-fields') {
      this.loadProductFieldConfiguration();
    } else if (tab === 'shop-fields') {
      this.loadShopFieldConfiguration();
    } else if (tab === 'general') {
      this.loadPublicViewStatus();
    }
  }

  clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

loadFieldConfiguration(): void {
    const shopId = this.selectedShopId();
    console.log('[Settings] Loading field configuration for shop:', shopId);
    
    if (!shopId) {
      this.errorMessage.set('No shop selected. Please select a shop first.');
      return;
    }

    this.isLoading.set(true);
    this.isShopOwned.set(true);
    this.clearMessages();
    
    this.apiService.getEmployeeFieldConfiguration(shopId).subscribe({
      next: (response) => {
        console.log('[Settings] Field configuration loaded:', response);
        
        // Handle both JSON string and parsed array formats
        let savedFields: any[] = [];
        if (response.data && response.data.fields) {
          // Check if fields is a string (JSON) or already an array
          if (typeof response.data.fields === 'string') {
            try {
              savedFields = JSON.parse(response.data.fields);
              console.log('[Settings] Parsed fields from JSON string:', savedFields);
            } catch (e) {
              console.log('[Settings] Failed to parse fields JSON string, using defaults');
            }
          } else if (Array.isArray(response.data.fields)) {
            savedFields = response.data.fields;
          }
        }
        
        if (savedFields.length > 0) {
          // Merge saved configuration with default fields
          this.availableFields = this.availableFields.map(field => {
            const savedField = savedFields.find((f: any) => f.key === field.key);
            if (savedField) {
              return { ...field, enabled: savedField.enabled, required: savedField.required };
            }
            return field;
          });
          console.log('[Settings] Merged fields:', this.availableFields);
        } else {
          // No valid fields configuration found, use defaults
          console.log('[Settings] Invalid field configuration, using defaults');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMessage = error.error?.message || '';
        console.error('[Settings] Error loading field configuration:', error);
        
        // Check for authorization error
        if (error.status === 403 || errorMessage.includes('Unauthorized')) {
          this.isShopOwned.set(false);
          this.errorMessage.set('You do not have permission to configure this shop. Please select a shop you own.');
        } else if (error.status === 404) {
          // No configuration found, use defaults - this is fine
          console.log('[Settings] No field configuration found, using defaults');
        } else {
          // Other errors
          console.log('[Settings] Error loading field configuration:', errorMessage);
        }
      }
    });
  }

  toggleField(field: EmployeeField): void {
    field.enabled = !field.enabled;
    this.clearMessages();
  }

  toggleRequired(field: EmployeeField): void {
    field.required = !field.required;
    this.clearMessages();
  }

saveFieldConfiguration(): void {
    if (this.activeTab() === 'employee-fields') {
      this.saveEmployeeFieldConfiguration();
    } else if (this.activeTab() === 'product-fields') {
      this.saveProductFieldConfiguration();
    } else if (this.activeTab() === 'shop-fields') {
      this.saveShopFieldConfiguration();
    }
  }

  saveEmployeeFieldConfiguration(): void {
    const shopId = this.selectedShopId();
    if (!shopId) {
      this.errorMessage.set('No shop selected. Please select a shop first.');
      return;
    }

    if (!this.isShopOwned()) {
      this.errorMessage.set('You do not have permission to configure this shop. Please select a shop you own.');
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();

    const fieldsToSave = this.availableFields.map(field => ({
      key: field.key,
      label: field.label,
      type: field.type,
      enabled: field.enabled,
      required: field.required
    }));

    this.apiService.configureEmployeeFields(shopId, fieldsToSave).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        this.successMessage.set('Employee fields configuration saved successfully!');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.isSaving.set(false);
        const errorMessage = error.error?.message || '';
        if (error.status === 403 || errorMessage.includes('Unauthorized')) {
          this.isShopOwned.set(false);
          this.errorMessage.set('You do not have permission to configure this shop. Please select a shop you own.');
        } else {
          this.errorMessage.set(errorMessage || 'Failed to save configuration. Please try again.');
        }
      }
    });
  }

  resetToDefaults(): void {
    this.availableFields = [
      { key: 'employeeCode', label: 'Employee Code', type: 'text', enabled: true, required: false },
      { key: 'designation', label: 'Designation', type: 'text', enabled: true, required: true },
      { key: 'department', label: 'Department', type: 'text', enabled: true, required: false },
      { key: 'employmentType', label: 'Employment Type', type: 'select', enabled: true, required: false },
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
    this.clearMessages();
    this.successMessage.set('Fields reset to defaults. Click Save to persist changes.');
  }

  selectAll(): void {
    this.availableFields.forEach(field => field.enabled = true);
    this.clearMessages();
  }

  deselectAll(): void {
    this.availableFields.forEach(field => field.enabled = false);
    this.clearMessages();
  }

  get enabledFieldsCount(): number {
    return this.availableFields.filter(f => f.enabled).length;
  }

  // Product field configuration methods
  loadEmployeeFieldConfiguration(): void {
    const shopId = this.selectedShopId();
    if (!shopId) return;

    this.isLoading.set(true);
    this.isShopOwned.set(true);
    
    this.apiService.getEmployeeFieldConfiguration(shopId).subscribe({
      next: (response) => {
        let savedFields: any[] = [];
        if (response.data && response.data.fields) {
          if (typeof response.data.fields === 'string') {
            try {
              savedFields = JSON.parse(response.data.fields);
            } catch (e) {
              console.log('[Settings] Failed to parse employee fields JSON');
            }
          } else if (Array.isArray(response.data.fields)) {
            savedFields = response.data.fields;
          }
        }
        
        if (savedFields.length > 0) {
          this.availableFields = this.availableFields.map(field => {
            const savedField = savedFields.find((f: any) => f.key === field.key);
            if (savedField) {
              return { ...field, enabled: savedField.enabled, required: savedField.required };
            }
            return field;
          });
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 403) {
          this.isShopOwned.set(false);
        }
      }
    });
  }

  loadProductFieldConfiguration(): void {
    const shopId = this.selectedShopId();
    if (!shopId) return;

    this.isLoading.set(true);
    this.isShopOwned.set(true);
    
    this.apiService.getProductFieldConfiguration(shopId).subscribe({
      next: (response) => {
        let savedFields: any[] = [];
        if (response.data && response.data.fields) {
          if (typeof response.data.fields === 'string') {
            try {
              savedFields = JSON.parse(response.data.fields);
            } catch (e) {
              console.log('[Settings] Failed to parse product fields JSON');
            }
          } else if (Array.isArray(response.data.fields)) {
            savedFields = response.data.fields;
          }
        }
        
        if (savedFields.length > 0) {
          this.availableProductFields = this.availableProductFields.map(field => {
            const savedField = savedFields.find((f: any) => f.key === field.key);
            if (savedField) {
              return { ...field, enabled: savedField.enabled };
            }
            return field;
          });
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 403) {
          this.isShopOwned.set(false);
        }
      }
    });
  }

  toggleProductField(field: ProductField): void {
    field.enabled = !field.enabled;
    this.clearMessages();
  }

  saveProductFieldConfiguration(): void {
    const shopId = this.selectedShopId();
    if (!shopId || !this.isShopOwned()) {
      this.errorMessage.set('No shop selected or permission denied.');
      return;
    }

    this.isSaving.set(true);
    const fieldsToSave = this.availableProductFields.map(field => ({
      key: field.key,
      label: field.label,
      type: field.type,
      enabled: field.enabled
    }));

    this.apiService.configureProductFields(shopId, fieldsToSave).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('Product fields configuration saved successfully!');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to save configuration.');
      }
    });
  }

  resetProductFieldsToDefaults(): void {
    this.availableProductFields = [
      { key: 'productCode', label: 'Product Code', type: 'text', enabled: true },
      { key: 'description', label: 'Description', type: 'textarea', enabled: true },
      { key: 'brand', label: 'Brand', type: 'text', enabled: true },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', enabled: true },
      { key: 'costPrice', label: 'Cost Price', type: 'number', enabled: true },
      { key: 'mrp', label: 'MRP', type: 'number', enabled: true },
      { key: 'discountPercentage', label: 'Discount (%)', type: 'number', enabled: true },
      { key: 'taxPercentage', label: 'Tax (%)', type: 'number', enabled: true },
      { key: 'stockQuantity', label: 'Stock Quantity', type: 'number', enabled: true },
      { key: 'reorderLevel', label: 'Reorder Level', type: 'number', enabled: true },
      { key: 'maxStockLevel', label: 'Max Stock Level', type: 'number', enabled: true },
      { key: 'weight', label: 'Weight', type: 'number', enabled: true },
      { key: 'dimensions', label: 'Dimensions', type: 'text', enabled: true },
      { key: 'imageUrl', label: 'Image URL', type: 'text', enabled: true },
      { key: 'isFeatured', label: 'Featured Product', type: 'checkbox', enabled: true },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date', enabled: true },
      { key: 'batchNumber', label: 'Batch Number', type: 'text', enabled: true },
      { key: 'warrantyMonths', label: 'Warranty (Months)', type: 'number', enabled: true },
      { key: 'returnDays', label: 'Return Days', type: 'number', enabled: true },
    ];
    this.clearMessages();
    this.successMessage.set('Product fields reset to defaults. Click Save to persist changes.');
  }

  selectAllProductFields(): void {
    this.availableProductFields.forEach(field => field.enabled = true);
    this.clearMessages();
  }

  deselectAllProductFields(): void {
    this.availableProductFields.forEach(field => field.enabled = false);
    this.clearMessages();
  }

  get enabledProductFieldsCount(): number {
    return this.availableProductFields.filter(f => f.enabled).length;
  }

  // Shop field configuration methods
  loadShopFieldConfiguration(): void {
    const shopId = this.selectedShopId();
    if (!shopId) return;

    this.isLoading.set(true);
    this.isShopOwned.set(true);
    
    this.apiService.getShopFieldConfiguration(shopId).subscribe({
      next: (response) => {
        let savedFields: any[] = [];
        if (response.data && response.data.fields) {
          if (typeof response.data.fields === 'string') {
            try {
              savedFields = JSON.parse(response.data.fields);
            } catch (e) {
              console.log('[Settings] Failed to parse shop fields JSON');
            }
          } else if (Array.isArray(response.data.fields)) {
            savedFields = response.data.fields;
          }
        }
        
        if (savedFields.length > 0) {
          this.availableShopFields = this.availableShopFields.map(field => {
            const savedField = savedFields.find((f: any) => f.key === field.key);
            if (savedField) {
              return { ...field, enabled: savedField.enabled };
            }
            return field;
          });
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 403) {
          this.isShopOwned.set(false);
        }
      }
    });
  }

  toggleShopField(field: ShopField): void {
    field.enabled = !field.enabled;
    this.clearMessages();
  }

  saveShopFieldConfiguration(): void {
    const shopId = this.selectedShopId();
    if (!shopId || !this.isShopOwned()) {
      this.errorMessage.set('No shop selected or permission denied.');
      return;
    }

    this.isSaving.set(true);
    const fieldsToSave = this.availableShopFields.map(field => ({
      key: field.key,
      label: field.label,
      type: field.type,
      enabled: field.enabled
    }));

    this.apiService.configureShopFields(shopId, fieldsToSave).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('Shop fields configuration saved successfully!');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to save configuration.');
      }
    });
  }

  resetShopFieldsToDefaults(): void {
    this.availableShopFields = [
      { key: 'shopName', label: 'Shop Name', type: 'text', enabled: true },
      { key: 'shopDescription', label: 'Description', type: 'textarea', enabled: true },
      { key: 'shopCategory', label: 'Category', type: 'text', enabled: true },
      { key: 'shopType', label: 'Shop Type', type: 'select', enabled: true },
      { key: 'shopLogo', label: 'Logo', type: 'text', enabled: true },
      { key: 'shopBanner', label: 'Banner', type: 'text', enabled: true },
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', enabled: true },
      { key: 'email', label: 'Email', type: 'text', enabled: true },
      { key: 'website', label: 'Website', type: 'text', enabled: true },
      { key: 'address', label: 'Address', type: 'text', enabled: true },
      { key: 'city', label: 'City', type: 'text', enabled: true },
      { key: 'state', label: 'State', type: 'text', enabled: true },
      { key: 'zipCode', label: 'Zip Code', type: 'text', enabled: true },
      { key: 'country', label: 'Country', type: 'text', enabled: true },
      { key: 'latitude', label: 'Latitude', type: 'number', enabled: true },
      { key: 'longitude', label: 'Longitude', type: 'number', enabled: true },
      { key: 'businessHoursStart', label: 'Business Hours Start', type: 'text', enabled: true },
      { key: 'businessHoursEnd', label: 'Business Hours End', type: 'text', enabled: true },
      { key: 'establishedYear', label: 'Established Year', type: 'number', enabled: true },
      { key: 'bankAccountHolderName', label: 'Bank Account Holder', type: 'text', enabled: true },
      { key: 'bankAccountNumber', label: 'Bank Account Number', type: 'text', enabled: true },
      { key: 'bankName', label: 'Bank Name', type: 'text', enabled: true },
      { key: 'bankBranchCode', label: 'Bank Branch Code', type: 'text', enabled: true },
      { key: 'bankIfscCode', label: 'Bank IFSC Code', type: 'text', enabled: true },
      { key: 'upiId', label: 'UPI ID', type: 'text', enabled: true },
      { key: 'referenceCode', label: 'Reference Code', type: 'text', enabled: true },
      { key: 'referralCode', label: 'Referral Code', type: 'text', enabled: true },
      { key: 'publicView', label: 'Public View', type: 'checkbox', enabled: true },
    ];
    this.clearMessages();
    this.successMessage.set('Shop fields reset to defaults. Click Save to persist changes.');
  }

  selectAllShopFields(): void {
    this.availableShopFields.forEach(field => field.enabled = true);
    this.clearMessages();
  }

  deselectAllShopFields(): void {
    this.availableShopFields.forEach(field => field.enabled = false);
    this.clearMessages();
  }

  get enabledShopFieldsCount(): number {
    return this.availableShopFields.filter(f => f.enabled).length;
  }

  // ============ PUBLIC VIEW METHODS ============
  loadPublicViewStatus(): void {
    const shopId = this.selectedShopId();
    if (!shopId) return;

    this.isLoadingPublicView.set(true);
    this.clearMessages();

    this.apiService.getPublicViewStatus(shopId).subscribe({
      next: (response) => {
        this.publicViewEnabled.set(response.data?.publicView ?? false);
        this.isLoadingPublicView.set(false);
      },
      error: (error) => {
        this.isLoadingPublicView.set(false);
        // Default to false if error
        this.publicViewEnabled.set(false);
        console.log('[Settings] Error loading public view status:', error);
      }
    });
  }

  togglePublicView(): void {
    const shopId = this.selectedShopId();
    if (!shopId) {
      this.errorMessage.set('No shop selected. Please select a shop first.');
      return;
    }

    if (!this.isShopOwned()) {
      this.errorMessage.set('You do not have permission to configure this shop. Please select a shop you own.');
      return;
    }

    this.isTogglingPublicView.set(true);
    this.clearMessages();

    const currentStatus = this.publicViewEnabled();
    const action = currentStatus 
      ? this.apiService.disablePublicView(shopId)
      : this.apiService.enablePublicView(shopId);

    action.subscribe({
      next: (response) => {
        const newStatus = response.data?.publicView ?? !currentStatus;
        this.publicViewEnabled.set(newStatus);
        this.isTogglingPublicView.set(false);
        this.successMessage.set(newStatus 
          ? 'Public view enabled successfully!' 
          : 'Public view disabled successfully!');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.isTogglingPublicView.set(false);
        const errorMessage = error.error?.message || '';
        if (error.status === 403 || errorMessage.includes('Unauthorized')) {
          this.isShopOwned.set(false);
          this.errorMessage.set('You do not have permission to configure this shop.');
        } else {
          this.errorMessage.set(errorMessage || 'Failed to toggle public view. Please try again.');
        }
      }
    });
  }
}
