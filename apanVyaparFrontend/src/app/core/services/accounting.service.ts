import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountingEntry, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private http = inject(HttpClient);
  private baseUrl = '/api/accounting';

  getAccountingEntries(
    shopId: string, 
    page: number = 1, 
    limit: number = 20,
    filters?: {
      transactionType?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Observable<ApiResponse<{ items: AccountingEntry[]; total: number; page: number; pageSize: number; totalPages: number }>> {
    let params: any = { page: page.toString(), limit: limit.toString() };
    if (filters) {
      if (filters.transactionType) params.transactionType = filters.transactionType;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    }
    return this.http.get<ApiResponse<{ items: AccountingEntry[]; total: number; page: number; pageSize: number; totalPages: number }>>(`${this.baseUrl}/${shopId}`, { params });
  }

  getAccountingEntry(entryId: string): Observable<ApiResponse<AccountingEntry>> {
    return this.http.get<ApiResponse<AccountingEntry>>(`${this.baseUrl}/entry/${entryId}`);
  }

  getAccountingDashboard(shopId: string, days: number = 30): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${shopId}/dashboard`, {
      params: { days: days.toString() }
    });
  }

  createAccountingEntry(shopId: string, entryData: {
    entryType: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    description?: string;
    paymentMethod?: 'CASH' | 'BANK' | 'CARD' | 'UPI';
    referenceNumber?: string;
    entryDate: string;
  }): Observable<ApiResponse<AccountingEntry>> {
    return this.http.post<ApiResponse<AccountingEntry>>(`${this.baseUrl}/${shopId}`, entryData);
  }

  updateAccountingEntry(entryId: string, entryData: any): Observable<ApiResponse<AccountingEntry>> {
    return this.http.put<ApiResponse<AccountingEntry>>(`${this.baseUrl}/entry/${entryId}`, entryData);
  }

  deleteAccountingEntry(entryId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/entry/${entryId}`);
  }

  // Reports
  getProfitLossReport(shopId: string, startDate: string, endDate: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${shopId}/profit-loss`, {
      params: { startDate, endDate }
    });
  }

  getCashFlowReport(shopId: string, startDate: string, endDate: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${shopId}/cash-flow`, {
      params: { startDate, endDate }
    });
  }

  getExpenseBreakdown(shopId: string, startDate: string, endDate: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${shopId}/expense-breakdown`, {
      params: { startDate, endDate }
    });
  }

  getIncomeBreakdown(shopId: string, startDate: string, endDate: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${shopId}/income-breakdown`, {
      params: { startDate, endDate }
    });
  }
}

