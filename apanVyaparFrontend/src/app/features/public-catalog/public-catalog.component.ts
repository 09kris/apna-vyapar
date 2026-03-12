import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PublicCatalogData, Product, Category, Shop } from '../../core/models';

@Component({
  selector: 'app-public-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-catalog.component.html',
  styleUrl: './public-catalog.component.css'
})
export class PublicCatalogComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Math for template
  Math = Math;

  // Data signals
  shop = signal<Shop | null>(null);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  
  // UI state
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Filter state
  searchQuery = signal('');
  selectedCategoryId = signal<string>('');
  sortBy = signal<'name' | 'price-low' | 'price-high'>('name');
  
  // Pagination
  currentPage = signal(1);
  productsPerPage = 12;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const shopId = params['shopId'];
      const referralCode = params['referral'];
      
      if (shopId) {
        this.loadPublicCatalog(shopId, referralCode);
      } else if (referralCode) {
        this.loadByReferralCode(referralCode);
      } else {
        this.error.set('Invalid request. Please provide a shop ID or referral code.');
        this.loading.set(false);
      }
    });
  }

  loadPublicCatalog(shopId: string, referralCode?: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getPublicCatalog(shopId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const catalogData = response.data as unknown as PublicCatalogData;
          this.shop.set(catalogData.shop || null);
          this.products.set(catalogData.products || []);
          this.categories.set(catalogData.categories || []);
          
          // Track access if referral code provided
          if (referralCode) {
            this.trackCatalogAccess(shopId, referralCode);
          }
        } else {
          this.error.set('Shop not found or catalog is not public');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load catalog');
        this.loading.set(false);
      }
    });
  }

  loadByReferralCode(referralCode: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getShopByReferralCode(referralCode).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const shopId = response.data.shopId;
          this.loadPublicCatalog(shopId, referralCode);
        } else {
          this.error.set('Invalid referral code');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Invalid referral code');
        this.loading.set(false);
      }
    });
  }

  trackCatalogAccess(shopId: string, referralCode: string): void {
    this.apiService.trackCatalogAccess(shopId, referralCode).subscribe({
      next: (response) => {
        console.log('Catalog access tracked');
      },
      error: (err) => {
        console.error('Failed to track catalog access:', err);
      }
    });
  }

  get filteredProducts(): Product[] {
    let filtered = [...this.products()];
    
    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(query) ||
        p.productCode?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (this.selectedCategoryId()) {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategoryId());
    }
    
    // Sort products
    switch (this.sortBy()) {
      case 'price-low':
        filtered.sort((a, b) => (a.retailPrice || 0) - (b.retailPrice || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.retailPrice || 0) - (a.retailPrice || 0));
        break;
      default:
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
    }
    
    return filtered;
  }

  get paginatedProducts(): Product[] {
    const start = (this.currentPage() - 1) * this.productsPerPage;
    const end = start + this.productsPerPage;
    return this.filteredProducts.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.productsPerPage);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
  }

  onCategoryChange(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
    this.currentPage.set(1);
  }

  onSortChange(sort: 'name' | 'price-low' | 'price-high'): void {
    this.sortBy.set(sort);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.categoryName || 'Uncategorized';
  }

  getDiscountPercentage(mrp: number | undefined, price: number): number {
    if (!mrp || mrp <= 0) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  }
}

