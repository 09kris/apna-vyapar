import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReferralService } from '../../../core/services/referral.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReferralCode, Product, Category } from '../../../core/models';

@Component({
  selector: 'app-referral-codes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './referral-codes.component.html',
  styleUrl: './referral-codes.component.css'
})
export class ReferralCodesComponent implements OnInit {
  private referralService = inject(ReferralService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  referralCodes = signal<ReferralCode[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal states
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedReferralCode = signal<ReferralCode | null>(null);

  // Form data for create/edit
  formData = signal({
    name: '',
    description: '',
    selectionType: 'products' as 'categories' | 'products',
    selectedProducts: [] as string[],
    selectedCategories: [] as string[]
  });

  // Available products and categories
  availableProducts = signal<Product[]>([]);
  availableCategories = signal<Category[]>([]);

  // Shop ID
  shopId = signal<string>('');

  // Selected items for multi-select
  selectedProductIds = signal<string[]>([]);
  selectedCategoryIds = signal<string[]>([]);

  // Toggle states
  toggling = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeShopId();
  }

  initializeShopId(): void {
    // First try to get shopId from query params
    this.route.queryParams.subscribe(params => {
      if (params['shopId']) {
        this.shopId.set(params['shopId']);
        this.loadReferralCodes(params['shopId']);
        this.loadProductsAndCategories(params['shopId']);
      } else {
        // Try from auth service
        const selectedShopId = this.authService.selectedShopId();
        if (selectedShopId) {
          this.shopId.set(selectedShopId);
          this.loadReferralCodes(selectedShopId);
          this.loadProductsAndCategories(selectedShopId);
        } else {
          // Try first shop from auth
          const userShops = this.authService.shops();
          if (userShops.length > 0) {
            this.shopId.set(userShops[0].shopId);
            this.loadReferralCodes(userShops[0].shopId);
            this.loadProductsAndCategories(userShops[0].shopId);
          }
        }
      }
    });
  }

  loadReferralCodes(shopId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.referralService.getShopReferralCodes(shopId).subscribe({
      next: (response) => {
        this.referralCodes.set(response.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load referral codes');
        this.loading.set(false);
      }
    });
  }

  loadProductsAndCategories(shopId: string): void {
    // Load products
    this.apiService.getProducts(shopId, undefined, undefined, 1, 100).subscribe({
      next: (response) => {
        this.availableProducts.set(response.data.items || []);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
      }
    });

    // Load categories
    this.apiService.getCategories(shopId).subscribe({
      next: (response) => {
        // ApiResponse<ProductCategory[]> – backend sometimes wraps array in { categories: [...] }
        const payload: any = response.data;
        if (payload?.categories) {
          this.availableCategories.set(payload.categories || []);
        } else if (Array.isArray(response.data)) {
          this.availableCategories.set(response.data || []);
        } else {
          this.availableCategories.set([]);
        }
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
      }
    });
  }

  openCreateModal(): void {
    this.formData.set({
      name: '',
      description: '',
      selectionType: 'products',
      selectedProducts: [],
      selectedCategories: []
    });
    this.selectedProductIds.set([]);
    this.selectedCategoryIds.set([]);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.formData.set({
      name: '',
      description: '',
      selectionType: 'products',
      selectedProducts: [],
      selectedCategories: []
    });
  }

  onSelectionTypeChange(): void {
    // Reset selections when type changes
    this.selectedProductIds.set([]);
    this.selectedCategoryIds.set([]);
  }

  toggleProductSelection(productId: string): void {
    const current = this.selectedProductIds();
    if (current.includes(productId)) {
      this.selectedProductIds.set(current.filter(id => id !== productId));
    } else {
      this.selectedProductIds.set([...current, productId]);
    }
  }

  toggleCategorySelection(categoryId: string): void {
    const current = this.selectedCategoryIds();
    if (current.includes(categoryId)) {
      this.selectedCategoryIds.set(current.filter(id => id !== categoryId));
    } else {
      this.selectedCategoryIds.set([...current, categoryId]);
    }
  }

  createReferralCode(): void {
    const data = this.formData();
    const shopId = this.shopId();

    if (!data.name.trim()) {
      this.error.set('Please enter a name for the referral code');
      return;
    }

    if (data.selectionType === 'products' && this.selectedProductIds().length === 0) {
      this.error.set('Please select at least one product');
      return;
    }

    if (data.selectionType === 'categories' && this.selectedCategoryIds().length === 0) {
      this.error.set('Please select at least one category');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.referralService.createReferralCode({
      shopId,
      name: data.name,
      description: data.description,
      selectionType: data.selectionType,
      selectedProducts: data.selectionType === 'products' ? this.selectedProductIds() : undefined,
      selectedCategories: data.selectionType === 'categories' ? this.selectedCategoryIds() : undefined
    }).subscribe({
      next: (response) => {
        this.successMessage.set('Referral code created successfully!');
        this.closeCreateModal();
        this.loadReferralCodes(shopId);
        this.loading.set(false);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create referral code');
        this.loading.set(false);
      }
    });
  }

  openEditModal(referralCode: ReferralCode): void {
    this.selectedReferralCode.set(referralCode);
    this.formData.set({
      name: referralCode.name,
      description: referralCode.description || '',
      selectionType: referralCode.selectionType || 'products',
      selectedProducts: referralCode.selectedProducts || [],
      selectedCategories: referralCode.selectedCategories || []
    });
    this.selectedProductIds.set(referralCode.selectedProducts || []);
    this.selectedCategoryIds.set(referralCode.selectedCategories || []);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedReferralCode.set(null);
  }

  updateReferralCode(): void {
    const referral = this.selectedReferralCode();
    const data = this.formData();

    if (!referral) return;

    if (!data.name.trim()) {
      this.error.set('Please enter a name for the referral code');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!referral.referralId) { this.error.set('Invalid referral'); this.loading.set(false); return; }
    this.referralService.updateReferralCode(referral.referralId, {
      name: data.name,
      description: data.description,
      selectionType: data.selectionType,
      selectedProducts: data.selectionType === 'products' ? this.selectedProductIds() : undefined,
      selectedCategories: data.selectionType === 'categories' ? this.selectedCategoryIds() : undefined
    }).subscribe({
      next: (response) => {
        this.successMessage.set('Referral code updated successfully!');
        this.closeEditModal();
        this.loadReferralCodes(this.shopId());
        this.loading.set(false);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update referral code');
        this.loading.set(false);
      }
    });
  }

  openDeleteModal(referralCode: ReferralCode): void {
    this.selectedReferralCode.set(referralCode);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedReferralCode.set(null);
  }

  deleteReferralCode(): void {
    const referral = this.selectedReferralCode();
    if (!referral) return;

    this.loading.set(true);
    this.error.set(null);

    if (!referral.referralId) { this.error.set('Invalid referral'); this.loading.set(false); return; }
    this.referralService.deleteReferralCode(referral.referralId).subscribe({
      next: (response) => {
        this.successMessage.set('Referral code deleted successfully!');
        this.closeDeleteModal();
        this.loadReferralCodes(this.shopId());
        this.loading.set(false);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete referral code');
        this.loading.set(false);
      }
    });
  }

  toggleReferralCodeStatus(referralCode: ReferralCode): void {
    if (!referralCode.referralId) return;
    this.toggling.set(referralCode.referralId);
    this.error.set(null);

    this.referralService.toggleReferralCodeStatus(referralCode.referralId, !referralCode.isActive).subscribe({
      next: (response) => {
        this.loadReferralCodes(this.shopId());
        this.toggling.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update referral code status');
        this.toggling.set(null);
      }
    });
  }

  copyReferralCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.successMessage.set('Referral code copied to clipboard!');
      setTimeout(() => this.successMessage.set(null), 3000);
    });
  }

  getSelectedCount(): number {
    const type = this.formData().selectionType;
    return type === 'products' ? this.selectedProductIds().length : this.selectedCategoryIds().length;
  }

  getProductNames(productIds: string[]): string {
    if (!productIds || productIds.length === 0) return 'No products selected';
    const products = this.availableProducts();
    const names = productIds.map(id => {
      const product = products.find(p => p.productId === id || p.id === id);
      return product?.productName || 'Unknown';
    });
    return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : '');
  }

  getCategoryNames(categoryIds: string[]): string {
    if (!categoryIds || categoryIds.length === 0) return 'No categories selected';
    const categories = this.availableCategories();
    const names = categoryIds.map(id => {
      const category = categories.find(c => c.id === id);
      return category?.categoryName || 'Unknown';
    });
    return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : '');
  }
}

