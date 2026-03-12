import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { User, Shop } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';

  // Signals for reactive state management
  private currentUserSignal = signal<User | null>(null);
  private shopsSignal = signal<Shop[]>([]);
  private selectedShopIdSignal = signal<string | null>(null);
  private tokenSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Computed values
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly shops = computed(() => this.shopsSignal());
  readonly selectedShopId = computed(() => this.selectedShopIdSignal());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly loading = computed(() => this.loadingSignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const shops = localStorage.getItem('shops');
    const selectedShopId = localStorage.getItem('selectedShopId');

    if (token) {
      this.tokenSignal.set(token);
    }

    if (user) {
      try {
        this.currentUserSignal.set(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    if (shops) {
      try {
        this.shopsSignal.set(JSON.parse(shops));
      } catch (e) {
        console.error('Error parsing stored shops:', e);
      }
    }

    if (selectedShopId) {
      this.selectedShopIdSignal.set(selectedShopId);
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    this.loadingSignal.set(true);
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.data?.token) {
          this.handleAuthSuccess(response.data);
        }
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        throw error;
      })
    );
  }

  register(data: { email: string; password: string; fullName: string; phoneNumber?: string }): Observable<any> {
    this.loadingSignal.set(true);
    return this.http.post<any>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.data?.token) {
          this.handleAuthSuccess(response.data);
        }
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        throw error;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shops');
    localStorage.removeItem('selectedShopId');

    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.shopsSignal.set([]);
    this.selectedShopIdSignal.set(null);

    this.router.navigate(['/login']);
  }

  completeShopOwnerProfile(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/complete-profile`, data).pipe(
      tap(response => {
        if (response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(response => {
        if (response.data) {
          this.currentUserSignal.set(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      })
    );
  }

  setSelectedShop(shopId: string): void {
    this.selectedShopIdSignal.set(shopId);
    localStorage.setItem('selectedShopId', shopId);
  }

  hasMultipleShops(): boolean {
    return this.shopsSignal().length > 1;
  }

  userRole(): string {
    const user = this.currentUserSignal();
    return user?.role || '';
  }

  userType(): string {
    const user = this.currentUserSignal();
    return user?.userType || '';
  }

  isShopOwner(): boolean {
    return this.userType() === 'SHOP_OWNER';
  }

  isEmployee(): boolean {
    return this.userType() === 'EMPLOYEE';
  }

  isAdmin(): boolean {
    return this.userType() === 'ADMIN' || this.userRole() === 'Admin' || this.userRole() === 'Owner';
  }

  private handleAuthSuccess(data: any): void {
    if (data.token) {
      this.tokenSignal.set(data.token);
      localStorage.setItem('token', data.token);
    }

    if (data.user) {
      this.currentUserSignal.set(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    if (data.shops) {
      this.shopsSignal.set(data.shops);
      localStorage.setItem('shops', JSON.stringify(data.shops));

      // Auto-select first shop if none selected
      if (!this.selectedShopIdSignal() && data.shops.length > 0) {
        this.setSelectedShop(data.shops[0].shopId);
      }
    }

    if (data.selectedShopId) {
      this.setSelectedShop(data.selectedShopId);
    }
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { token, password });
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-email`, { token });
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, {}).pipe(
      tap(response => {
        if (response.data?.token) {
          this.tokenSignal.set(response.data.token);
          localStorage.setItem('token', response.data.token);
        }
      })
    );
  }
}

