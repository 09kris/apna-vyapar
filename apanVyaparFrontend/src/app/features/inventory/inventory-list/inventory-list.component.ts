import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { InventoryTransaction, Product } from '../../../core/models';

interface InventorySummary {
  totalProducts: number;
  totalStockValue: number;
  totalRetailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overStockCount: number;
  recentTransactions: number;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.css'
})
export class InventoryListComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  // Public getter for shops to be used in template
  shops = this.authService.shops;

  // Data signals
  transactions = signal<InventoryTransaction[]>([]);
  lowStockProducts = signal<any[]>([]);
  products = signal<Product[]>([]);
  summary = signal<InventorySummary | null>(null);
  
  loading = signal(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Filter states
  selectedShopId = signal<string>('');
  selectedProductId = signal<string>('');
  selectedType = signal<string>('');
  
  // Modal states
  showStockModal = signal(false);
  selectedProduct = signal<any>(null);
  stockForm = {
    transactionType: 'ADJUSTMENT',
    quantityChange: 0,
    unitCost: 0,
    remarks: ''
  };

  // Transaction types
  transactionTypes = [
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'SALE', label: 'Sale' },
    { value: 'RETURN', label: 'Return' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'DAMAGE', label: 'Damage' }
  ];

  ngOnInit(): void {
    this.loadShopsFromAuth();
  }

  loadShopsFromAuth(): void {
    const userShops = this.authService.shops();
    if (userShops.length > 0) {
      this.initializeShopSelection(userShops);
    } else {
      this.loadShopsFromApi();
    }
  }

  loadShopsFromApi(): void {
    this.apiService.getShops().subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          this.initializeShopSelection(response.data);
        } else {
          this.error.set('No shops found. Please create a shop first.');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set('Failed to load shops');
        this.loading.set(false);
      }
    });
  }

  initializeShopSelection(shops: any[]): void {
    const queryShopId = this.route.snapshot.queryParams['shopId'];
    const selectedShopId = this.authService.selectedShopId();

    if (queryShopId) {
      this.selectedShopId.set(queryShopId);
      this.loadAllData(queryShopId);
    } else if (selectedShopId) {
      this.selectedShopId.set(selectedShopId);
      this.loadAllData(selectedShopId);
    } else if (shops.length > 0) {
      this.selectedShopId.set(shops[0].shopId);
      this.loadAllData(shops[0].shopId);
    }
  }

  loadAllData(shopId: string): void {
    this.loadInventorySummary(shopId);
    this.loadTransactions(shopId);
    this.loadLowStockProducts(shopId);
    this.loadProducts(shopId);
  }

  loadInventorySummary(shopId: string): void {
    this.apiService.getInventorySummary(shopId).subscribe({
      next: (response) => {
        if (response.data) {
          this.summary.set(response.data);
        }
      },
      error: (err) => {
        console.error('Failed to load inventory summary:', err);
      }
    });
  }

  loadTransactions(shopId: string): void {
    this.loading.set(true);
    this.apiService.getShopInventoryTransactions(shopId).subscribe({
      next: (response) => {
        this.transactions.set(response.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load transactions');
        this.loading.set(false);
      }
    });
  }

  loadLowStockProducts(shopId: string): void {
    this.apiService.getLowStockProducts(shopId).subscribe({
      next: (response) => {
        this.lowStockProducts.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load low stock products:', err);
      }
    });
  }

  loadProducts(shopId: string): void {
    this.apiService.getProducts(shopId, undefined, undefined, 1, 1000).subscribe({
      next: (response) => {
        this.products.set(response.data.items || []);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
      }
    });
  }

  onShopChange(): void {
    const shopId = this.selectedShopId();
    if (shopId) {
      this.loadAllData(shopId);
    }
  }

  filterTransactions(): void {
    // This method is used for side effects, filtering is done in getFilteredTransactions()
  }

  getFilteredTransactions(): InventoryTransaction[] {
    let filtered = this.transactions();
    const productId = this.selectedProductId();
    const type = this.selectedType();

    if (productId) {
      filtered = filtered.filter(t => t.productId === productId);
    }
    if (type) {
      filtered = filtered.filter(t => t.transactionType === type);
    }

    return filtered;
  }

  getProductName(productId: string): string {
    const product = this.products().find(p => p.id === productId);
    return product ? product.productName : 'Unknown Product';
  }

  getTransactionTypeLabel(type: string): string {
    const found = this.transactionTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getTransactionTypeClass(type: string): string {
    switch (type) {
      case 'PURCHASE': return 'type-purchase';
      case 'SALE': return 'type-sale';
      case 'RETURN': return 'type-return';
      case 'ADJUSTMENT': return 'type-adjustment';
      case 'DAMAGE': return 'type-damage';
      default: return '';
    }
  }

  // Stock adjustment modal methods
  openStockModal(product: any): void {
    this.selectedProduct.set(product);
    this.stockForm = {
      transactionType: 'ADJUSTMENT',
      quantityChange: 0,
      unitCost: product.costPrice || 0,
      remarks: ''
    };
    this.showStockModal.set(true);
  }

  closeStockModal(): void {
    this.showStockModal.set(false);
    this.selectedProduct.set(null);
  }

  submitStockAdjustment(): void {
    const product = this.selectedProduct();
    const shopId = this.selectedShopId();
    
    if (!product || !shopId) return;

    const data = {
      productId: product.id,
      transactionType: this.stockForm.transactionType,
      quantityChange: Number(this.stockForm.quantityChange),
      unitCost: this.stockForm.unitCost ? Number(this.stockForm.unitCost) : undefined,
      remarks: this.stockForm.remarks || undefined
    };

    this.apiService.createInventoryTransaction(shopId, data).subscribe({
      next: (response) => {
        this.successMessage.set('Stock adjusted successfully');
        this.closeStockModal();
        this.loadAllData(shopId);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to adjust stock');
        setTimeout(() => this.error.set(null), 3000);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
