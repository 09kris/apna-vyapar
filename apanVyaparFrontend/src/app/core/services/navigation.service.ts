import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  description?: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private authService = inject(AuthService);

  getSidebarNavigation(): NavItem[] {
    const user = this.authService.currentUser();
    const userType = user?.userType;
    const role = user?.role;

    // Base navigation items for all authenticated users
    const navigationItems: NavItem[] = [
      {
        label: 'Dashboard',
        route: '/dashboard',
        icon: '📊',
        description: 'View dashboard and statistics'
      }
    ];

    // Add shop-specific items for shop owners
    if (userType === 'SHOP_OWNER' || role === 'Owner' || role === 'Admin') {
      navigationItems.push(
        {
          label: 'Shops',
          route: '/shops',
          icon: '🏪',
          description: 'Manage your shops',
          roles: ['Owner', 'Admin']
        },
        {
          label: 'Products',
          route: '/products',
          icon: '📦',
          description: 'Manage products'
        },
        {
          label: 'Categories',
          route: '/categories',
          icon: '📁',
          description: 'Manage categories'
        },
        {
          label: 'Customers',
          route: '/customers',
          icon: '👥',
          description: 'Manage customers'
        },
        {
          label: 'Orders',
          route: '/orders',
          icon: '🛒',
          description: 'View and manage orders'
        },
        {
          label: 'Inventory',
          route: '/inventory',
          icon: '📈',
          description: 'Track inventory'
        },
        {
          label: 'Employees',
          route: '/employees',
          icon: '👨‍💼',
          description: 'Manage employees',
          roles: ['Owner', 'Admin']
        },
        {
          label: 'Payroll',
          route: '/payroll',
          icon: '💰',
          description: 'Manage payroll',
          roles: ['Owner', 'Admin']
        },
        {
          label: 'Accounting',
          route: '/accounting',
          icon: '📒',
          description: 'Track income and expenses'
        },
        {
          label: 'Referral Codes',
          route: '/referral-codes',
          icon: '🎁',
          description: 'Manage referral codes'
        },
        {
          label: 'Settings',
          route: '/settings',
          icon: '⚙️',
          description: 'Configure settings',
          roles: ['Owner', 'Admin']
        }
      );
    }

    // Add employee-specific items
    if (userType === 'EMPLOYEE') {
      navigationItems.push(
        {
          label: 'Products',
          route: '/products',
          icon: '📦',
          description: 'View products'
        },
        {
          label: 'Categories',
          route: '/categories',
          icon: '📁',
          description: 'View categories'
        },
        {
          label: 'Customers',
          route: '/customers',
          icon: '👥',
          description: 'Manage customers'
        },
        {
          label: 'Orders',
          route: '/orders',
          icon: '🛒',
          description: 'View and manage orders'
        },
        {
          label: 'Inventory',
          route: '/inventory',
          icon: '📈',
          description: 'Track inventory'
        },
        {
          label: 'My Dashboard',
          route: '/employees/dashboard',
          icon: '📊',
          description: 'Employee dashboard'
        }
      );
    }

    // Add customer/client-specific items
    if (userType === 'CUSTOMER') {
      navigationItems.push(
        {
          label: 'My Account',
          route: '/my-account',
          icon: '👤',
          description: 'View account details'
        },
        {
          label: 'My Orders',
          route: '/my-orders',
          icon: '🛒',
          description: 'View order history'
        },
        {
          label: 'Loyalty Points',
          route: '/my-loyalty',
          icon: '⭐',
          description: 'View loyalty points'
        },
        {
          label: 'My Catalogs',
          route: '/my-catalogs',
          icon: '📚',
          description: 'Access catalogs'
        }
      );
    }

    // Add notifications for all users
    navigationItems.push({
      label: 'Notifications',
      route: '/notifications',
      icon: '🔔',
      description: 'View notifications'
    });

    return navigationItems;
  }

  getTopNavigation(): NavItem[] {
    return [
      {
        label: 'Home',
        route: '/dashboard',
        icon: '🏠'
      },
      {
        label: 'Public Catalog',
        route: '/public-catalog',
        icon: '🌐'
      }
    ];
  }
}

