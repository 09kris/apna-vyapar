import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogAccess } from '../../core/models';

@Component({
  selector: 'app-catalog-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-access.component.html',
  styleUrl: './catalog-access.component.css'
})
export class CatalogAccessComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  catalogAccess = signal<CatalogAccess[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form for requesting access
  referralCode = signal('');
  requesting = signal(false);

  ngOnInit(): void {
    this.loadCatalogAccess();
  }

  loadCatalogAccess(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getMyCatalogAccess().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.catalogAccess.set(response.data);
        } else {
          this.catalogAccess.set([]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load catalog access');
        this.loading.set(false);
      }
    });
  }

  requestAccess(): void {
    const code = this.referralCode().trim();
    if (!code) {
      this.error.set('Please enter a referral code');
      return;
    }

    this.requesting.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.apiService.requestCatalogAccess(code).subscribe({
      next: (response) => {
        this.requesting.set(false);
        if (response.success) {
          this.successMessage.set('Catalog access requested successfully!');
          this.referralCode.set('');
          this.loadCatalogAccess();
        } else {
          this.error.set(response.message || 'Failed to request access');
        }
      },
      error: (err) => {
        this.requesting.set(false);
        this.error.set(err.error?.message || 'Failed to request access. Please check the referral code.');
      }
    });
  }

  viewCatalog(shopId: string): void {
    this.router.navigate(['/public-catalog'], { queryParams: { shopId } });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

