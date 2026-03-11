import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService, NavItem } from '../../core/services/navigation.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout-container">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <h1 class="logo" *ngIf="!sidebarCollapsed()">Apna Vyapar</h1>
          <button class="toggle-btn" (click)="toggleSidebar()">
            <span class="menu-icon">☰</span>
          </button>
        </div>
        
        <nav class="sidebar-nav">
          <!-- Dynamic Navigation Items based on User Role -->
          @for (item of navItems(); track item.route) {
            <a [routerLink]="item.route" 
               routerLinkActive="active" 
               class="nav-item"
               [title]="item.description || item.label">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
            </a>
          }
        </nav>
        
        <div class="sidebar-footer">
          <!-- Settings - only visible to Shop Owners and Admins -->
          @if (canViewSettings()) {
            <a routerLink="/settings" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text" *ngIf="!sidebarCollapsed()">Settings</span>
            </a>
          }
          <button class="nav-item logout-item" (click)="logout()" [attr.title]="'Logout'">
            <span class="nav-icon">🚪</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Logout</span>
          </button>
        </div>
      </aside>
      
      <main class="main-content">
        <header class="header">
          <div class="header-left">
            <h2 class="page-title">{{ pageTitle() }}</h2>
          </div>
          <div class="header-right">
            <div class="shop-selector" *ngIf="hasMultipleShops()">
              <select (change)="onShopChange($event)" [value]="selectedShopId()">
                <option *ngFor="let shop of shops()" [value]="shop.shopId">
                  {{ shop.shopName }}
                </option>
              </select>
            </div>
            <div class="user-info">
              <span class="user-name">{{ currentUser()?.fullName || 'User' }}</span>
              <span class="user-role">{{ currentUser()?.role || '' }}</span>
            </div>
          </div>
        </header>
        
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout-container { display: flex; min-height: 100vh; background: #f8fafc; }
    .sidebar { width: 260px; background: #1e293b; color: white; display: flex; flex-direction: column; transition: width 0.3s ease; }
    .sidebar.collapsed { width: 70px; }
    .sidebar-header { padding: 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; }
    .logo { font-size: 1.25rem; font-weight: 700; color: #3b82f6; margin: 0; }
    .toggle-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.25rem; }
    .sidebar-nav { flex: 1; padding: 15px 10px; overflow-y: auto; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 15px; color: #94a3b8; text-decoration: none; border-radius: 8px; margin-bottom: 5px; cursor: pointer; transition: all 0.2s; border: none; background: none; width: 100%; text-align: left; }
    .nav-item:hover { background: #334155; color: white; }
    .nav-item.active { background: #3b82f6; color: white; }
    .nav-icon { font-size: 1.25rem; width: 24px; text-align: center; flex-shrink: 0; }
    .nav-text { font-size: 0.9rem; }
    .sidebar-footer { padding: 15px 10px; border-top: 1px solid #334155; }
    .logout-item { color: #ef4444; }
    .logout-item:hover { background: #fee2e2; color: #dc2626; }
    .main-content { flex: 1; display: flex; flex-direction: column; }
    .header { background: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .page-title { font-size: 1.5rem; font-weight: 600; color: #1e293b; margin: 0; }
    .header-right { display: flex; align-items: center; gap: 20px; }
    .shop-selector select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; font-size: 0.9rem; }
    .user-info { display: flex; flex-direction: column; align-items: flex-end; }
    .user-name { font-weight: 600; color: #1e293b; }
    .user-role { font-size: 0.8rem; color: #64748b; }
    .content { flex: 1; padding: 30px; overflow-y: auto; }
  `]
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  navService = inject(NavigationService);
  private router = inject(Router);
  
  sidebarCollapsed = signal(false);
  pageTitle = signal('Dashboard');
  
  currentUser = this.authService.currentUser;
  shops = this.authService.shops;
  selectedShopId = this.authService.selectedShopId;
  
  // Get navigation items as a computed signal - ensures proper reactivity
  navItems = computed(() => this.navService.getSidebarNavigation());
  
  // Check if user can view settings (only owners and admins)
  canViewSettings = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    
    const userType = user.userType;
    const role = user.role;
    
    // Shop Owners and Admins can access settings
    return userType === 'SHOP_OWNER' || userType === 'ADMIN' || 
           role === 'Owner' || role === 'Admin';
  });
  
  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
  
  hasMultipleShops(): boolean {
    return this.authService.hasMultipleShops();
  }
  
  onShopChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.authService.setSelectedShop(select.value);
  }
  
  logout(): void {
    this.authService.logout();
  }
}

