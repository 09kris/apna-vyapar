import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Category, Shop } from '../../../core/models';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.css'
})
export class CategoryFormComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  shops = signal<Shop[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  isEditMode = signal(false);
  categoryId = signal<string | null>(null);
  shopId = signal<string>('');

  // Computed shop name for display
  shopName = computed(() => {
    const currentShopId = this.shopId();
    const currentShops = this.shops();
    if (!currentShopId || currentShops.length === 0) {
      return 'N/A';
    }
    const shop = currentShops.find(s => s.shopId === currentShopId);
    return shop?.shopName || 'N/A';
  });

  // Form fields
  categoryName = '';
  description = '';
  sortOrder = 0;

  ngOnInit(): void {
    this.loadShops();
    
    this.route.queryParams.subscribe(params => {
      if (params['shopId']) {
        this.shopId.set(params['shopId']);
      }
    });

    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'add') {
        this.isEditMode.set(true);
        this.categoryId.set(params['id']);
        this.loadCategory(params['id']);
      }
    });
  }

  loadShops(): void {
    this.apiService.getShops().subscribe({
      next: (response) => {
        this.shops.set(response.data || []);
        if (this.shops().length > 0 && !this.shopId()) {
          this.shopId.set(this.shops()[0].shopId);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load shops');
        this.loading.set(false);
      }
    });
  }

  loadCategory(id: string): void {
    this.loading.set(true);
    const shopId = this.shopId() || '';
    
    this.apiService.getCategory(id, shopId).subscribe({
      next: (response) => {
        const category = response.data as any;
        if (category) {
          // Map categoryId to id if needed for consistency
          const categoryData = category.categoryId ? { ...category, id: category.categoryId } : category;
          this.categoryName = categoryData.categoryName;
          this.description = categoryData.description || '';
          this.sortOrder = categoryData.sortOrder || 0;
          this.shopId.set(categoryData.shopId);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load category');
        this.loading.set(false);
      }
    });
  }

  onShopChange(): void {
    // Reset form when shop changes in add mode
    if (!this.isEditMode()) {
      this.categoryName = '';
      this.description = '';
      this.sortOrder = 0;
    }
  }

  onSubmit(): void {
    if (!this.shopId()) {
      this.error.set('Please select a shop');
      return;
    }

    if (!this.categoryName || this.categoryName.trim().length === 0) {
      this.error.set('Category name is required');
      return;
    }

    this.error.set(null);
    this.saving.set(true);

    const categoryData = {
      categoryName: this.categoryName.trim(),
      description: this.description?.trim() || undefined,
      sortOrder: this.sortOrder || 0
    };

    if (this.isEditMode() && this.categoryId()) {
      // Update existing category
      this.apiService.updateCategory(this.categoryId()!, this.shopId(), categoryData).subscribe({
        next: () => {
          this.successMessage.set('Category updated successfully');
          this.saving.set(false);
          setTimeout(() => {
            this.router.navigate(['/categories'], { queryParams: { shopId: this.shopId() } });
          }, 1500);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update category');
          this.saving.set(false);
        }
      });
    } else {
      // Create new category
      this.apiService.createCategory(this.shopId(), categoryData).subscribe({
        next: () => {
          this.successMessage.set('Category created successfully');
          this.saving.set(false);
          setTimeout(() => {
            this.router.navigate(['/categories'], { queryParams: { shopId: this.shopId() } });
          }, 1500);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create category');
          this.saving.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/categories'], { queryParams: { shopId: this.shopId() } });
  }
}
