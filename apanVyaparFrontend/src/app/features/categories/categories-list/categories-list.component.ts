import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Category, Shop } from '../../../core/models';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css'
})
export class CategoriesListComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  categories = signal<Category[]>([]);
  shops = signal<Shop[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  selectedShopId = signal<string>('');

  ngOnInit(): void {
    this.loadShops();
    this.route.queryParams.subscribe(params => {
      if (params['shopId']) {
        this.selectedShopId.set(params['shopId']);
        this.loadCategories(params['shopId']);
      }
    });
  }

  loadShops(): void {
    this.apiService.getShops().subscribe({
      next: (response) => {
        this.shops.set(response.data || []);
        if (this.shops().length > 0 && !this.selectedShopId()) {
          this.selectedShopId.set(this.shops()[0].shopId);
          this.loadCategories(this.shops()[0].shopId);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load shops');
      }
    });
  }

  loadCategories(shopId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getCategories(shopId).subscribe({
      next: (response: any) => {
        // Handle the response structure from backend
        // response.data could be: 
        // - { categories: [...] } - standard response
        // - { categories: { count, rows } } - Sequelize paginated response
        // - { categories: [...] } directly as array
        // - [...] direct array response
        let categoriesArray: any[] = [];
        
        if (response.data) {
          // Case 1: Direct array response - response.data is an array
          if (Array.isArray(response.data)) {
            categoriesArray = response.data;
          }
          // Case 2: response.data has categories property
          else if (response.data.categories) {
            // Check if categories is a Sequelize paginated response (has rows property)
            if (response.data.categories.rows && Array.isArray(response.data.categories.rows)) {
              categoriesArray = response.data.categories.rows;
            }
            // Check if categories is a direct array
            else if (Array.isArray(response.data.categories)) {
              categoriesArray = response.data.categories;
            }
            // categories exists but is not a valid array
            else {
              console.warn('Categories data is not an array:', response.data.categories);
              categoriesArray = [];
            }
          }
        }
        
        // Map categoryId to id for frontend compatibility
        const mappedCategories = categoriesArray.map((cat: any) => ({
          ...cat,
          id: cat.categoryId // Ensure id is available for template
        }));
        this.categories.set(mappedCategories);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Failed to load categories');
        this.loading.set(false);
      }
    });
  }

  onShopChange(): void {
    this.loadCategories(this.selectedShopId());
  }

  deleteCategory(category: Category): void {
    if (!confirm(`Are you sure you want to delete "${category.categoryName}"?`)) {
      return;
    }

    this.apiService.deleteCategory(category.id || (category as any).categoryId, this.selectedShopId()).subscribe({
      next: () => {
        this.loadCategories(this.selectedShopId());
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete category');
      }
    });
  }

  toggleCategoryStatus(category: Category): void {
    const newStatus = !category.isActive;
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${category.categoryName}"?`)) {
      return;
    }

    this.apiService.updateCategory(category.id || (category as any).categoryId, this.selectedShopId(), { isActive: newStatus } as any).subscribe({
      next: () => {
        this.loadCategories(this.selectedShopId());
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update category status');
      }
    });
  }
}
