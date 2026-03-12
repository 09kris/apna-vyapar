import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page
  router.navigate(['/login'], { 
    queryParams: { returnUrl: route.url.join('/') } 
  });
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already logged in, redirect to dashboard
  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const shopOwnerGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: route.url.join('/') } 
    });
    return false;
  }

  // Check if user is a shop owner
  if (authService.isShopOwner() || authService.isAdmin()) {
    return true;
  }

  // Redirect to dashboard if not a shop owner
  router.navigate(['/dashboard']);
  return false;
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: route.url.join('/') } 
    });
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as string[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has any of the required roles
  const userRole = authService.userRole();
  const userType = authService.userType();

  const hasRole = requiredRoles.some(role => 
    role === userRole || 
    role === userType ||
    (role === 'Owner' && userType === 'SHOP_OWNER') ||
    (role === 'Admin' && userType === 'ADMIN')
  );

  if (hasRole) {
    return true;
  }

  // Redirect to dashboard if user doesn't have required role
  router.navigate(['/dashboard']);
  return false;
};

export const employeeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is an employee
  if (authService.isEmployee()) {
    return true;
  }

  // Redirect to dashboard if not an employee
  router.navigate(['/dashboard']);
  return false;
};

export const customerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is a customer
  const userType = authService.userType();
  if (userType === 'CUSTOMER') {
    return true;
  }

  // Redirect to dashboard if not a customer
  router.navigate(['/dashboard']);
  return false;
};

