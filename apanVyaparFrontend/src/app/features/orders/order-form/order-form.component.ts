import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService, OrderItem } from '../../../core/services/order.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, ShopCustomer } from '../../../core/models';
import { Subject, debounceTime, takeUntil } from 'rxjs';

interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  productCode?: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  subtotal: number;
  totalPrice: number;
  availableStock: number;
}

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  private destroy$ = new Subject<void>();
  private draftAutoSave$ = new Subject<void>();

  // Data
  customers = signal<ShopCustomer[]>([]);
  filteredCustomers = signal<ShopCustomer[]>([]);
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  
  // Form data
  selectedCustomer = signal<ShopCustomer | null>(null);
  orderType = signal<'RETAIL' | 'WHOLESALE'>('RETAIL');
  orderItems = signal<OrderLineItem[]>([]);
  customerNotes = signal('');
  internalNotes = signal('');
  
  // Search queries
  customerSearchQuery = signal('');
  productSearchQuery = signal('');
  
  // UI State
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // Show/hide modals
  showProductSelector = signal(false);
  showCustomerModal = signal(false);
  showDeleteConfirm = signal(false);
  itemToDelete = signal<string | null>(null);
  
  // Customer dropdown
  customerDropdownOpen = signal(false);
  
  // Selected shop
  selectedShopId = computed(() => this.authService.selectedShopId());
  
  // Order ID for edit mode
  orderId = signal<string | null>(null);
  isEditMode = computed(() => !!this.orderId());

  // Computed totals
  subtotal = computed(() => {
    return this.orderItems().reduce((sum, item) => sum + item.subtotal, 0);
  });

  totalDiscount = computed(() => {
    return this.orderItems().reduce((sum, item) => sum + item.discountAmount, 0);
  });

  totalTax = computed(() => {
    return this.orderItems().reduce((sum, item) => sum + item.taxAmount, 0);
  });

  grandTotal = computed(() => {
    return this.subtotal() - this.totalDiscount() + this.totalTax();
  });

  // Item count
  itemCount = computed(() => this.orderItems().length);

  ngOnInit(): void {
    // Check if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !id.includes('create')) {
      this.orderId.set(id);
      this.loadOrderForEdit(id);
    } else {
      this.loadCustomers();
      this.loadProducts();
      this.loadDraft();
    }
    
    // Set up auto-save for draft
    this.draftAutoSave$.pipe(
      debounceTime(5000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.autoSaveDraft();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load order for editing
  loadOrderForEdit(orderId: string): void {
    this.loading.set(true);
    this.orderService.getOrder(orderId).subscribe({
      next: (response) => {
        const order = response.data;
        if (order) {
          // Set order type
          this.orderType.set(order.orderType || 'RETAIL');
          
          // Set customer (will be loaded)
          this.loadCustomers();
          
          // Convert items to line items
          const items: OrderLineItem[] = (order.items || []).map((item: any, index: number) => ({
            id: item.orderItemId || `item_${index}`,
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode,
            productImage: (item as any).productImage,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: item.discountPercentage || 0,
            discountAmount: item.discountAmount || 0,
            taxPercentage: item.taxPercentage || 0,
            taxAmount: item.taxAmount || 0,
            subtotal: item.subtotal || (item.quantity * item.unitPrice),
            totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
            availableStock: (item as any).availableStock || 999
          }));
          this.orderItems.set(items);
          
          // Set notes
          this.customerNotes.set(order.customerNotes || '');
          this.internalNotes.set(order.internalNotes || order.notes || '');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load order');
        this.loading.set(false);
      }
    });
  }

  loadCustomers(): void {
    const shopId = this.selectedShopId();
    if (!shopId) {
      this.error.set('No shop selected');
      return;
    }

    this.loading.set(true);
    this.apiService.getShopCustomers(shopId).subscribe({
      next: (response) => {
        const customers = response.data || [];
        this.customers.set(customers);
        this.filteredCustomers.set(customers);
        this.loading.set(false);
        
        // If editing, try to find the customer
        if (this.isEditMode()) {
          const orderId = this.orderId();
          this.orderService.getOrder(orderId!).subscribe({
            next: (res) => {
              const order = res.data;
              if (order) {
                const customer = customers.find((c: any) => c.id === order.customerId || c.customerId === order.customerId);
                if (customer) {
                  this.selectedCustomer.set(customer);
                }
              }
            }
          });
        }
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.error.set('Failed to load customers');
        this.loading.set(false);
      }
    });
  }

  loadProducts(): void {
    const shopId = this.selectedShopId();
    if (!shopId) {
      this.error.set('No shop selected');
      return;
    }

    this.loading.set(true);
    this.apiService.getProducts(shopId, undefined, undefined, 1, 100).subscribe({
      next: (response) => {
        const products = response.data?.items || response.data || [];
        this.products.set(products);
        this.filteredProducts.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error.set('Failed to load products');
        this.loading.set(false);
      }
    });
  }

  // Draft management
  loadDraft(): void {
    const shopId = this.selectedShopId();
    if (!shopId) return;
    
    const draft = this.orderService.getDraft(shopId);
    if (draft) {
      if (draft.orderType) {
        this.orderType.set(draft.orderType);
      }
      if (draft.customerNotes) {
        this.customerNotes.set(draft.customerNotes);
      }
      if (draft.internalNotes) {
        this.internalNotes.set(draft.internalNotes);
      }
      // Restore customer
      if (draft.customerId) {
const customer = this.customers().find(c => c.id === draft.customerId);
        if (customer) {
          this.selectedCustomer.set(customer);
        }
      }
    }
  }

  autoSaveDraft(): void {
    const shopId = this.selectedShopId();
    if (!shopId || this.orderItems().length === 0) return;
    
    const draft = {
      customerId: this.selectedCustomer()?.id,
      orderType: this.orderType(),
      items: this.orderItems().map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      customerNotes: this.customerNotes(),
      internalNotes: this.internalNotes()
    };
    
    this.orderService.saveDraft(shopId, draft);
  }

  // Customer search/filter
  onCustomerSearch(): void {
    const query = this.customerSearchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredCustomers.set(this.customers());
    } else {
      const filtered = this.customers().filter(customer =>
        customer.fullName.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query))
      );
      this.filteredCustomers.set(filtered);
    }
    this.customerDropdownOpen.set(true);
  }

  // Product search/filter
  onProductSearch(): void {
    const query = this.productSearchQuery().toLowerCase().trim();
    if (!query) {
      // Show only products with stock
      this.filteredProducts.set(this.products().filter(p => (p.stockQuantity || 0) > 0));
    } else {
      const filtered = this.products().filter(product =>
        (product.productName.toLowerCase().includes(query) ||
        (product.productCode && product.productCode.toLowerCase().includes(query))) &&
        (product.stockQuantity || 0) > 0
      );
      this.filteredProducts.set(filtered);
    }
  }

  // Select customer
  selectCustomer(customer: ShopCustomer): void {
    this.selectedCustomer.set(customer);
    this.customerSearchQuery.set('');
    this.filteredCustomers.set(this.customers());
    this.customerDropdownOpen.set(false);
    this.triggerAutoSave();
  }

  // Clear customer selection
  clearCustomer(): void {
    this.selectedCustomer.set(null);
    this.triggerAutoSave();
  }

  // Toggle customer dropdown
  toggleCustomerDropdown(): void {
    this.customerDropdownOpen.set(!this.customerDropdownOpen());
    if (this.customerDropdownOpen()) {
      this.filteredCustomers.set(this.customers());
    }
  }

  // Open product selector
  openProductSelector(): void {
    this.productSearchQuery.set('');
    this.onProductSearch();
    this.showProductSelector.set(true);
  }

  // Close product selector
  closeProductSelector(): void {
    this.showProductSelector.set(false);
  }

  // Get product ID (handles both 'id' and 'productId')
  private getProductId(product: Product): string {
    return (product as any).productId || product.id;
  }

  // Get customer ID (handles both 'id' and 'customerId')
  private getCustomerId(customer: ShopCustomer): string {
    return (customer as any).customerId || customer.id || '';
  }

  // Add product to order
  addProduct(product: Product): void {
    const productId = this.getProductId(product);
    
    // Check if product already exists in order
    const existingItem = this.orderItems().find(item => item.productId === productId);
    if (existingItem) {
      this.error.set('Product already added to order');
      setTimeout(() => this.error.set(null), 3000);
      return;
    }

    // Get price based on order type
    const unitPrice = this.orderType() === 'WHOLESALE' 
      ? product.wholesalePrice 
      : product.retailPrice;

    const newItem: OrderLineItem = {
      id: this.generateId(),
      productId: productId,
      productName: product.productName,
      productCode: product.productCode,
      productImage: product.imageUrl,
      quantity: 1,
      unitPrice: unitPrice,
      discountPercentage: product.discountPercentage || 0,
      discountAmount: 0,
      taxPercentage: product.taxPercentage || 0,
      taxAmount: 0,
      subtotal: unitPrice,
      totalPrice: unitPrice,
      availableStock: product.stockQuantity || 0
    };

    this.calculateItemTotals(newItem);
    this.orderItems.update(items => [...items, newItem]);
    this.closeProductSelector();
    this.triggerAutoSave();
  }

  // Remove product from order
  removeProduct(itemId: string): void {
    this.orderItems.update(items => items.filter(item => item.id !== itemId));
    this.triggerAutoSave();
  }

  // Update quantity
  updateQuantity(itemId: string, quantity: number): void {
    const items = this.orderItems();
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const item = { ...items[itemIndex] };
    
    if (quantity <= 0) {
      quantity = 1;
    }
    if (quantity > item.availableStock) {
      quantity = item.availableStock;
      this.error.set(`Maximum available stock is ${item.availableStock}`);
      setTimeout(() => this.error.set(null), 3000);
    }

    item.quantity = quantity;
    this.calculateItemTotals(item);
    
    items[itemIndex] = item;
    this.orderItems.set([...items]);
    this.triggerAutoSave();
  }

  // Update unit price
  updateUnitPrice(itemId: string, unitPrice: number): void {
    const items = this.orderItems();
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const item = { ...items[itemIndex] };
    item.unitPrice = unitPrice;
    this.calculateItemTotals(item);
    
    items[itemIndex] = item;
    this.orderItems.set([...items]);
    this.triggerAutoSave();
  }

  // Update discount percentage
  updateDiscount(itemId: string, discountPercentage: number): void {
    const items = this.orderItems();
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const item = { ...items[itemIndex] };
    item.discountPercentage = discountPercentage;
    this.calculateItemTotals(item);
    
    items[itemIndex] = item;
    this.orderItems.set([...items]);
    this.triggerAutoSave();
  }

  // Calculate item totals
  private calculateItemTotals(item: OrderLineItem): void {
    // Calculate subtotal
    item.subtotal = item.quantity * item.unitPrice;
    
    // Calculate discount amount
    item.discountAmount = item.subtotal * (item.discountPercentage / 100);
    
    // Calculate taxable amount
    const taxableAmount = item.subtotal - item.discountAmount;
    
    // Calculate tax amount
    item.taxAmount = taxableAmount * (item.taxPercentage / 100);
    
    // Calculate total price
    item.totalPrice = taxableAmount + item.taxAmount;
  }

  // Change order type
  onOrderTypeChange(): void {
    // Update prices for all items based on new order type
    const items = this.orderItems();
    const updatedItems = items.map(item => {
      const product = this.products().find(p => this.getProductId(p) === item.productId);
      if (product) {
        const newItem = { ...item };
        newItem.unitPrice = this.orderType() === 'WHOLESALE' 
          ? product.wholesalePrice 
          : product.retailPrice;
        this.calculateItemTotals(newItem);
        return newItem;
      }
      return item;
    });
    this.orderItems.set(updatedItems);
    this.triggerAutoSave();
  }

  // Trigger auto-save
  private triggerAutoSave(): void {
    this.draftAutoSave$.next();
  }

  // Validate form
  validateForm(): boolean {
    if (!this.selectedCustomer()) {
      this.error.set('Please select a customer');
      return false;
    }

    if (this.orderItems().length === 0) {
      this.error.set('Please add at least one product to the order');
      return false;
    }

    // Check for zero quantity items
    const zeroQuantityItems = this.orderItems().filter(item => item.quantity <= 0);
    if (zeroQuantityItems.length > 0) {
      this.error.set('Please ensure all items have quantity greater than 0');
      return false;
    }

    return true;
  }

  // Submit order
  onSubmit(): void {
    this.error.set(null);
    this.successMessage.set(null);

    if (!this.validateForm()) {
      return;
    }

    const shopId = this.selectedShopId();
    if (!shopId) {
      this.error.set('No shop selected');
      return;
    }

    const customer = this.selectedCustomer();
    if (!customer) {
      this.error.set('Please select a customer');
      return;
    }

    this.saving.set(true);

    const orderData = {
      customerId: this.getCustomerId(customer),
      orderType: this.orderType(),
      items: this.orderItems().map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage,
        taxPercentage: item.taxPercentage
      })),
      customerNotes: this.customerNotes() || undefined,
      internalNotes: this.internalNotes() || undefined
    };

    if (this.isEditMode()) {
      // Update existing order
      this.orderService.updateOrder(this.orderId()!, { ...orderData, notes: orderData.customerNotes }).subscribe({
        next: (response) => {
          this.saving.set(false);
          this.successMessage.set('Order updated successfully!');
          this.clearDraft();
          setTimeout(() => {
            this.router.navigate(['/orders']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error updating order:', err);
          this.error.set(err.error?.message || 'Failed to update order');
          this.saving.set(false);
        }
      });
    } else {
      // Create new order
      this.orderService.createOrder(shopId, orderData).subscribe({
        next: (response) => {
          this.saving.set(false);
          this.successMessage.set('Order created successfully!');
          this.clearDraft();
          setTimeout(() => {
            this.router.navigate(['/orders']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error creating order:', err);
          this.error.set(err.error?.message || 'Failed to create order');
          this.saving.set(false);
        }
      });
    }
  }

  // Save as draft
  saveDraft(): void {
    this.autoSaveDraft();
    this.successMessage.set('Draft saved successfully!');
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  // Clear draft
  clearDraft(): void {
    const shopId = this.selectedShopId();
    if (shopId) {
      this.orderService.clearDraft(shopId);
    }
  }

  // Cancel and go back
  cancel(): void {
    this.router.navigate(['/orders']);
  }

  // Generate unique ID
  private generateId(): string {
    return 'item_' + Math.random().toString(36).substr(2, 9);
  }

  // Clear error
  clearError(): void {
    this.error.set(null);
  }

  // Clear success message
  clearSuccess(): void {
    this.successMessage.set(null);
  }
}

