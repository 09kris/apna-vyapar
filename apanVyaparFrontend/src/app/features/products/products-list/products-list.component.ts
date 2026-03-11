import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReferralService } from '../../../core/services/referral.service';
import { Product, Category, Shop } from '../../../core/models';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})
export class ProductsListComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private referralService = inject(ReferralService);
  private route = inject(ActivatedRoute);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  shops = signal<Shop[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filter states
  selectedShopId = signal<string>('');
  selectedCategoryId = signal<string>('');
  searchQuery = signal<string>('');

  // Selection state for referral code generation
  selectedProducts = signal<Product[]>([]);
  showReferralModal = signal(false);
  referralName = signal('');
  referralDescription = signal('');
  creatingReferral = signal(false);
  referralSuccess = signal<string | null>(null);

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
        this.loadCategories(params['shopId']);
      }
      this.loadProducts();
    });
  }

  loadShopsFromAuth(): void {
    // First try to get shops from AuthService - available from login response
    const userShops = this.authService.shops();
    
    if (userShops.length > 0) {
      // Use shops from auth service
      this.shops.set(userShops);
      this.initializeShopSelection();
    } else {
      // Fallback: Fetch shops from API if auth service has no shops
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
          // No shops available - user needs to create a shop first
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
    // Try to get shopId from query params first, then from auth service
    const queryShopId = this.route.snapshot.queryParams['shopId'];
    const selectedShopId = this.authService.selectedShopId();

    if (queryShopId) {
      this.selectedShopId.set(queryShopId);
      this.loadCategories(queryShopId);
    } else if (selectedShopId) {
      this.selectedShopId.set(selectedShopId);
      this.loadCategories(selectedShopId);
    } else if (this.shops().length > 0) {
      // Use first shop from auth service or API
      this.selectedShopId.set(this.shops()[0].shopId);
      this.loadCategories(this.shops()[0].shopId);
    } else {
      // No shops available - user needs to create a shop first
      this.error.set('No shops found. Please create a shop first.');
    }
  }

  loadCategories(shopId: string): void {
    this.apiService.getCategories(shopId).subscribe({
      next: (response: any) => {
        // Handle nested categories response from backend
        if (response.data?.categories) {
          this.categories.set(response.data.categories || []);
        } else if (Array.isArray(response.data)) {
          this.categories.set(response.data || []);
        } else {
          this.categories.set([]);
        }
      },
      error: (err: any) => {
        console.error('Failed to load categories:', err);
        this.categories.set([]);
      }
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    const shopId = this.selectedShopId();
    const categoryId = this.selectedCategoryId();
    const search = this.searchQuery();
    const page = this.currentPage();

    this.apiService.getProducts(shopId || undefined, categoryId || undefined, search || undefined, page, this.pageSize).subscribe({
      next: (response) => {
        this.products.set(response.data.items || []);
        this.totalItems.set(response.data.total);
        this.totalPages.set(response.data.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load products');
        this.loading.set(false);
      }
    });
  }

  onShopChange(): void {
    this.currentPage.set(1);
    this.loadCategories(this.selectedShopId());
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Are you sure you want to delete "${product.productName}"?`)) {
      return;
    }

    const productId = product.productId || product.id;
    if (!productId) {
      this.error.set('Product ID not found');
      return;
    }

    this.apiService.deleteProduct(productId).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete product');
      }
    });
  }

  toggleProductStatus(product: Product): void {
    const newStatus = !product.isActive;
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${product.productName}"?`)) {
      return;
    }

    const productId = product.productId || product.id;
    if (!productId) {
      this.error.set('Product ID not found');
      return;
    }

    this.apiService.updateProduct(productId, { isActive: newStatus } as any).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update product status');
      }
    });
  }

  // ============ Product Selection Methods ============
  
  isProductSelected(product: Product): boolean {
    const productId = product.productId || product.id;
    return this.selectedProducts().some(p => (p.productId || p.id) === productId);
  }

  toggleProductSelection(product: Product): void {
    if (this.isProductSelected(product)) {
      const productId = product.productId || product.id;
      this.selectedProducts.set(this.selectedProducts().filter(p => (p.productId || p.id) !== productId));
    } else {
      this.selectedProducts.update(products => [...products, product]);
    }
  }

  toggleSelectAll(): void {
    if (this.allProductsSelected()) {
      this.selectedProducts.set([]);
    } else {
      this.selectedProducts.set([...this.products()]);
    }
  }

  allProductsSelected(): boolean {
    return this.products().length > 0 && this.selectedProducts().length === this.products().length;
  }

  // ============ Referral Code Generation Methods ============

  generateReferralCode(): void {
    if (this.selectedProducts().length === 0) {
      this.error.set('Please select at least one product');
      return;
    }
    this.referralName.set('');
    this.referralDescription.set('');
    this.referralSuccess.set(null);
    this.showReferralModal.set(true);
  }

  closeReferralModal(): void {
    this.showReferralModal.set(false);
    this.referralName.set('');
    this.referralDescription.set('');
    this.referralSuccess.set(null);
  }

  createReferralCode(): void {
    const name = this.referralName().trim();
    if (!name) {
      this.error.set('Please enter a name for the referral code');
      return;
    }

    if (this.selectedProducts().length === 0) {
      this.error.set('Please select at least one product');
      return;
    }

    const shopId = this.selectedShopId();
    const productIds = this.selectedProducts().map(p => p.productId || p.id || '').filter(id => id);

    this.creatingReferral.set(true);
    this.error.set(null);

    this.referralService.generateProductReferralCode(
      shopId,
      productIds,
      name,
      this.referralDescription()
    ).subscribe({
      next: (response) => {
        this.creatingReferral.set(false);
        this.referralSuccess.set(`Referral code "${response.data?.referralCode}" created successfully!`);
        setTimeout(() => {
          this.closeReferralModal();
          this.selectedProducts.set([]);
        }, 2000);
      },
      error: (err) => {
        this.creatingReferral.set(false);
        this.error.set(err.error?.message || 'Failed to create referral code');
      }
    });
  }
}
