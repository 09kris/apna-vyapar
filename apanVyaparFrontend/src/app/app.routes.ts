import { Routes } from '@angular/router';
import { authGuard, guestGuard, shopOwnerGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'complete-profile',
    loadComponent: () => import('./features/auth/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent),
    canActivate: [authGuard]
  },
  
  // Public Catalog - accessible without authentication
  {
    path: 'public-catalog',
    loadComponent: () => import('./features/public-catalog/public-catalog.component').then(m => m.PublicCatalogComponent)
  },
  
  // Protected routes with layout - requires authentication
  {
    path: '',
    loadComponent: () => import('./shared/layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      // Dashboard - accessible to all authenticated users
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      
      // Shops - only accessible to shop owners
      {
        path: 'shops',
        loadComponent: () => import('./features/shops/shops-list/shops-list.component').then(m => m.ShopsListComponent),
        canActivate: [shopOwnerGuard]
      },
      // Specific routes must come BEFORE dynamic parameter routes
      {
        path: 'shops/add',
        loadComponent: () => import('./features/shops/shop-form/shop-form.component').then(m => m.ShopFormComponent),
        canActivate: [shopOwnerGuard]
      },
      {
        path: 'shops/:id/edit',
        loadComponent: () => import('./features/shops/shop-form/shop-form.component').then(m => m.ShopFormComponent),
        canActivate: [shopOwnerGuard]
      },
      {
        path: 'shops/:id',
        loadComponent: () => import('./features/shops/shop-form/shop-form.component').then(m => m.ShopFormComponent)
      },
      
      // Products routes - accessible to owners and employees
      {
        path: 'products',
        loadComponent: () => import('./features/products/products-list/products-list.component').then(m => m.ProductsListComponent)
      },
      {
        path: 'products/add',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      
      // Categories routes
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories-list/categories-list.component').then(m => m.CategoriesListComponent)
      },
      {
        path: 'categories/add',
        loadComponent: () => import('./features/categories/category-form/category-form.component').then(m => m.CategoryFormComponent)
      },
      {
        path: 'categories/:id',
        loadComponent: () => import('./features/categories/category-form/category-form.component').then(m => m.CategoryFormComponent)
      },
      
      // Customers routes
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers-list/customers-list.component').then(m => m.CustomersListComponent)
      },
      {
        path: 'customers/add',
        loadComponent: () => import('./features/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent)
      },
      {
        path: 'customers/:id',
        loadComponent: () => import('./features/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent)
      },
      {
        path: 'customers/:id/edit',
        loadComponent: () => import('./features/customers/customer-form/customer-form.component').then(m => m.CustomerFormComponent)
      },
      
      // Employees routes - only accessible to shop owners
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employees-list/employees-list.component').then(m => m.EmployeesListComponent),
        canActivate: [shopOwnerGuard]
      },
      {
        path: 'employees/dashboard',
        loadComponent: () => import('./features/employees/employee-dashboard/employee-dashboard.component').then(m => m.EmployeeDashboardComponent)
      },
      {
        path: 'employees/add',
        loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
        canActivate: [shopOwnerGuard]
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
      },
      {
        path: 'employees/:id/edit',
        loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
        canActivate: [shopOwnerGuard]
      },
      
      // Payroll routes - only accessible to shop owners
      {
        path: 'payroll',
        loadComponent: () => import('./features/payroll/payroll-list/payroll-list.component').then(m => m.PayrollListComponent),
        canActivate: [shopOwnerGuard]
      },
      {
        path: 'payroll/add',
        loadComponent: () => import('./features/payroll/payroll-form/payroll-form.component').then(m => m.PayrollFormComponent),
        canActivate: [shopOwnerGuard]
      },
      {
        path: 'payroll/:id',
        loadComponent: () => import('./features/payroll/payroll-form/payroll-form.component').then(m => m.PayrollFormComponent),
        canActivate: [shopOwnerGuard]
      },
      {
        path: 'payroll/:id/pay',
        loadComponent: () => import('./features/payroll/payroll-form/payroll-form.component').then(m => m.PayrollFormComponent),
        canActivate: [shopOwnerGuard]
      },
      
      // Settings route - only accessible to shop owners
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [shopOwnerGuard]
      },
      
      // Inventory routes
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
      },
      
      // Admin routes - only accessible to admins
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [roleGuard],
        data: { roles: ['Owner', 'Admin'] }
      },
      
      // Orders routes
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders-list/orders-list.component').then(m => m.OrdersListComponent)
      },
      {
        path: 'orders/create',
        loadComponent: () => import('./features/orders/order-form/order-form.component').then(m => m.OrderFormComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-details/order-details.component').then(m => m.OrderDetailsComponent)
      },
      {
        path: 'orders/:id/edit',
        loadComponent: () => import('./features/orders/order-form/order-form.component').then(m => m.OrderFormComponent)
      },
      
      // Payment routes
      {
        path: 'payments/checkout',
        loadComponent: () => import('./features/payments/payment-checkout.component').then(m => m.PaymentCheckoutComponent)
      },
      {
        path: 'payments/history',
        loadComponent: () => import('./features/payments/payment-history.component').then(m => m.PaymentHistoryComponent)
      },

      // Accounting routes
      {
        path: 'accounting',
        loadComponent: () => import('./features/accounting/accounting-list/accounting-list.component').then(m => m.AccountingListComponent)
      },
      {
        path: 'accounting/add',
        loadComponent: () => import('./features/accounting/accounting-form/accounting-form.component').then(m => m.AccountingFormComponent)
      },

      // Referral codes routes
      {
        path: 'referral-codes',
        loadComponent: () => import('./features/referral/referral-codes/referral-codes.component').then(m => m.ReferralCodesComponent)
      },
      
      // Client Dashboard routes (for retail/wholesale customers)
      {
        path: 'my-account',
        loadComponent: () => import('./features/client/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent)
      },
      {
        path: 'my-orders',
        loadComponent: () => import('./features/client/client-orders/client-orders.component').then(m => m.ClientOrdersComponent)
      },
      {
        path: 'my-orders/:id',
        loadComponent: () => import('./features/client/client-order-details/client-order-details.component').then(m => m.ClientOrderDetailsComponent)
      },
      {
        path: 'my-loyalty',
        loadComponent: () => import('./features/client/client-loyalty/client-loyalty.component').then(m => m.ClientLoyaltyComponent)
      },
      
      // Notifications route
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      
      // Catalog Access route
      {
        path: 'my-catalogs',
        loadComponent: () => import('./features/catalog-access/catalog-access.component').then(m => m.CatalogAccessComponent)
      },
      
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // Catch all - redirect to login
  {
    path: '**',
    redirectTo: 'login'
  }
];
