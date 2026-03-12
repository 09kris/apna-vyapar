import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, Category, Shop, CreateProductRequest } from '../../../core/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form data
  product = signal<CreateProductRequest>({
    shopId: '',
    categoryId: '',
    productName: '',
    productCode: '',
    description: '',
    brand: '',
    manufacturer: '',
    retailPrice: 0,
    wholesalePrice: 0,
    costPrice: 0,
    mrp: 0,
    discountPercentage: 0,
    taxPercentage: 0,
    stockQuantity: 0,
    reorderLevel: 0,
    maxStockLevel: 0,
    unit: 'piece',
    weight: 0,
    dimensions: '',
    imageUrl: '',
    galleryImages: [],
    tags: [],
    isFeatured: false,
    expiryDate: undefined,
    batchNumber: '',
    warrantyMonths: 0,
    returnDays: 0
  });

  // Lists
  categories = signal<Category[]>([]);
  shops = signal<Shop[]>([]);

  // State
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  productId = signal<string | null>(null);

  // From query params
  shopId = signal<string>('');

  ngOnInit(): void {
    // First, subscribe to route params for edit mode (doesn't depend on shopId)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.productId.set(params['id']);
        // loadProduct will handle loading categories when it gets shopId from product data
      } else {
        this.loading.set(false);
      }
    });

    // IMPORTANT: First read queryParams from snapshot (immediate access)
    // THEN set up subscriptions
    const queryShopId = this.route.snapshot.queryParams['shopId'];
    if (queryShopId) {
      this.shopId.set(queryShopId);
    }

    // Load shops from AuthService (available from login response)
    this.loadShopsFromAuth(queryShopId);

    // Subscribe to queryParams for shopId changes (for navigation between shops)
    this.route.queryParams.subscribe(params => {
      if (params['shopId'] && params['shopId'] !== this.shopId()) {
        this.shopId.set(params['shopId']);
        this.loadCategories(params['shopId']);
      }
    });
  }

  loadShopsFromAuth(queryShopId?: string): void {
    // First try to get shops from AuthService - available from login response
    const userShops = this.authService.shops();
    
    if (userShops.length > 0) {
      // Use shops from auth service
      this.shops.set(userShops);
      this.initializeShopSelection(queryShopId);
    } else {
      // Fallback: Fetch shops from API if auth service has no shops
      this.loadShopsFromApi(queryShopId);
    }
  }

  loadShopsFromApi(queryShopId?: string): void {
    this.apiService.getShops().subscribe({
      next: (response) => {
        this.shops.set(response.data || []);
        if (this.shops().length > 0) {
          this.initializeShopSelection(queryShopId);
        } else {
          // No shops available - user needs to create a shop first
          this.error.set('No shops found. Please create a shop first.');
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load shops:', err);
        this.error.set('Failed to load shops. Please try again.');
        this.loading.set(false);
      }
    });
  }

  initializeShopSelection(queryShopId?: string): void {
    // Use passed queryShopId if provided, otherwise get from route snapshot
    const shopIdToUse = queryShopId || this.route.snapshot.queryParams['shopId'];
    const selectedShopId = this.authService.selectedShopId();

    if (shopIdToUse) {
      this.shopId.set(shopIdToUse);
      this.loadCategories(shopIdToUse);
    } else if (selectedShopId) {
      this.shopId.set(selectedShopId);
      this.loadCategories(selectedShopId);
    } else if (this.shops().length > 0) {
      // Use first shop from auth service or API
      this.shopId.set(this.shops()[0].shopId);
      this.loadCategories(this.shops()[0].shopId);
    } else {
      // No shops available - user needs to create a shop first
      this.error.set('No shops found. Please create a shop first.');
      this.loading.set(false);
    }
  }

  loadCategories(shopId: string): void {
    // Guard: Don't load categories if shopId is empty
    if (!shopId || shopId.trim() === '') {
      console.warn('Cannot load categories: shopId is empty');
      this.categories.set([]);
      return;
    }
    
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

  loadProduct(id: string): void {
    this.apiService.getProduct(id).subscribe({
      next: (response) => {
        if (response.data) {
          const productData = response.data;
          this.product.set({
            shopId: productData.shopId || '',
            categoryId: productData.categoryId,
            productName: productData.productName,
            productCode: productData.productCode,
            description: productData.description,
            brand: productData.brand,
            manufacturer: productData.manufacturer,
            retailPrice: productData.retailPrice,
            wholesalePrice: productData.wholesalePrice,
            costPrice: productData.costPrice,
            mrp: productData.mrp,
            discountPercentage: productData.discountPercentage,
            taxPercentage: productData.taxPercentage,
            stockQuantity: productData.stockQuantity,
            reorderLevel: productData.reorderLevel,
            maxStockLevel: productData.maxStockLevel,
            unit: productData.unit,
            weight: productData.weight,
            dimensions: productData.dimensions,
            imageUrl: productData.imageUrl,
            galleryImages: productData.galleryImages,
            tags: productData.tags,
            isFeatured: productData.isFeatured,
            expiryDate: productData.expiryDate,
            batchNumber: productData.batchNumber,
            warrantyMonths: productData.warrantyMonths,
            returnDays: productData.returnDays
          });
          
          // Load categories for the product's shop
          if (productData.shopId) {
            this.shopId.set(productData.shopId);
            this.loadCategories(productData.shopId);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load product');
        this.loading.set(false);
      }
    });
  }

  onShopChange(): void {
    this.loadCategories(this.shopId());
  }

  saveProduct(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const productData = this.product();

    if (this.isEditMode() && this.productId()) {
      this.apiService.updateProduct(this.productId()!, productData).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/products'], { queryParams: { shopId: this.shopId() } });
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update product');
          this.saving.set(false);
        }
      });
    } else {
      this.apiService.createProduct(this.shopId(), productData).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/products'], { queryParams: { shopId: this.shopId() } });
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create product');
          this.saving.set(false);
        }
      });
    }
  }

  validateForm(): boolean {
    const product = this.product();

    if (!product.categoryId) {
      this.error.set('Please select a category');
      return false;
    }

    if (!product.productName || product.productName.trim() === '') {
      this.error.set('Product name is required');
      return false;
    }

    const retailPrice = product.retailPrice ?? 0;
    const wholesalePrice = product.wholesalePrice ?? 0;

    if (retailPrice <= 0) {
      this.error.set('Retail price must be greater than 0');
      return false;
    }

    if (wholesalePrice <= 0) {
      this.error.set('Wholesale price must be greater than 0');
      return false;
    }

    if (!product.unit || product.unit.trim() === '') {
      this.error.set('Unit is required');
      return false;
    }

    return true;
  }

  cancel(): void {
    this.router.navigate(['/products'], { queryParams: { shopId: this.shopId() } });
  }
}
