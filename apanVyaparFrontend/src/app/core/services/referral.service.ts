import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReferralCode, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReferralService {
  private http = inject(HttpClient);
  private baseUrl = '/api/referral';

  getShopReferralCodes(shopId: string): Observable<ApiResponse<ReferralCode[]>> {
    return this.http.get<ApiResponse<ReferralCode[]>>(`${this.baseUrl}/codes/${shopId}`);
  }

  getReferralCode(referralId: string): Observable<ApiResponse<ReferralCode>> {
    return this.http.get<ApiResponse<ReferralCode>>(`${this.baseUrl}/code/${referralId}`);
  }

  createReferralCode(data: {
    shopId: string;
    name: string;
    description?: string;
    selectionType: 'products' | 'categories';
    selectedProducts?: string[];
    selectedCategories?: string[];
    discountType?: 'PERCENTAGE' | 'FIXED';
    discountValue?: number;
    minOrderAmount?: number;
    maxUses?: number;
    validFrom?: string;
    validUntil?: string;
  }): Observable<ApiResponse<ReferralCode>> {
    return this.http.post<ApiResponse<ReferralCode>>(`${this.baseUrl}/codes`, data);
  }

  // Method for generating product-specific referral codes
  generateProductReferralCode(
    shopId: string,
    productIds: string[],
    name: string,
    description?: string,
    discountType?: 'PERCENTAGE' | 'FIXED',
    discountValue?: number
  ): Observable<ApiResponse<ReferralCode>> {
    return this.createReferralCode({
      shopId,
      name,
      description,
      selectionType: 'products',
      selectedProducts: productIds,
      discountType,
      discountValue
    });
  }

  updateReferralCode(
    referralId: string,
    data: {
      name?: string;
      description?: string;
      selectionType?: 'products' | 'categories';
      selectedProducts?: string[];
      selectedCategories?: string[];
      discountType?: 'PERCENTAGE' | 'FIXED';
      discountValue?: number;
      minOrderAmount?: number;
      maxUses?: number;
      validFrom?: string;
      validUntil?: string;
    }
  ): Observable<ApiResponse<ReferralCode>> {
    return this.http.put<ApiResponse<ReferralCode>>(`${this.baseUrl}/codes/${referralId}`, data);
  }

  deleteReferralCode(referralId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/codes/${referralId}`);
  }

  toggleReferralCodeStatus(referralId: string, isActive: boolean): Observable<ApiResponse<ReferralCode>> {
    return this.http.put<ApiResponse<ReferralCode>>(`${this.baseUrl}/codes/${referralId}/toggle`, { isActive });
  }

  applyReferralCode(shopId: string, code: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/apply`, { shopId, code });
  }

  getReferralStats(shopId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/stats/${shopId}`);
  }
}

