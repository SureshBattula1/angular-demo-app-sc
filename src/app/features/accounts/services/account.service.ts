import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import {
  AccountCategory,
  AccountCategoryFormData,
  Transaction,
  AccountDashboard,
  TransactionFormData
} from '../../../core/models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly ENDPOINT = '/accounts';
  private readonly TRANSACTION_ENDPOINT = '/transactions';
  private readonly apiUrl = environment.apiUrl || 'http://localhost:8000/api';
  private http = inject(HttpClient);

  constructor(private apiService: ApiService) {}

  /**
   * Get accounts dashboard
   */
  getDashboard(params?: Record<string, unknown>): Observable<ApiResponse<AccountDashboard>> {
    return this.apiService.get<AccountDashboard>(`${this.ENDPOINT}/dashboard`, params);
  }

  /**
   * Get account categories
   */
  getCategories(params?: Record<string, unknown>): Observable<ApiResponse<AccountCategory[]>> {
    return this.apiService.get<AccountCategory[]>(`${this.ENDPOINT}/categories`, params);
  }

  /**
   * Get single account category
   */
  getCategory(id: string | number): Observable<ApiResponse<AccountCategory>> {
    return this.apiService.get<AccountCategory>(`${this.ENDPOINT}/categories/${id}`);
  }

  /**
   * Create new account category
   */
  createCategory(data: AccountCategoryFormData): Observable<ApiResponse<AccountCategory>> {
    return this.apiService.post<AccountCategory>(`${this.ENDPOINT}/categories`, data);
  }

  /**
   * Update account category
   */
  updateCategory(id: string | number, data: Partial<AccountCategoryFormData>): Observable<ApiResponse<AccountCategory>> {
    return this.apiService.put<AccountCategory>(`${this.ENDPOINT}/categories/${id}`, data);
  }

  /**
   * Delete account category
   */
  deleteCategory(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/categories/${id}`);
  }

  /**
   * Toggle category status
   */
  toggleCategoryStatus(id: string | number): Observable<ApiResponse<AccountCategory>> {
    return this.apiService.put<AccountCategory>(`${this.ENDPOINT}/categories/${id}/toggle-status`, {});
  }

  /**
   * Get all transactions
   */
  getTransactions(params?: Record<string, unknown>): Observable<ApiResponse<Transaction[]>> {
    return this.apiService.get<Transaction[]>(this.TRANSACTION_ENDPOINT, params);
  }

  /**
   * Get single transaction
   */
  getTransaction(id: string | number): Observable<ApiResponse<Transaction>> {
    return this.apiService.get<Transaction>(`${this.TRANSACTION_ENDPOINT}/${id}`);
  }

  /**
   * Create new transaction
   */
  createTransaction(data: TransactionFormData): Observable<ApiResponse<Transaction>> {
    return this.apiService.post<Transaction>(this.TRANSACTION_ENDPOINT, data);
  }

  /**
   * Update transaction
   */
  updateTransaction(id: string | number, data: Partial<TransactionFormData>): Observable<ApiResponse<Transaction>> {
    return this.apiService.put<Transaction>(`${this.TRANSACTION_ENDPOINT}/${id}`, data);
  }

  /**
   * Delete transaction
   */
  deleteTransaction(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.TRANSACTION_ENDPOINT}/${id}`);
  }

  /**
   * Approve transaction
   */
  approveTransaction(id: string | number): Observable<ApiResponse<Transaction>> {
    return this.apiService.post<Transaction>(`${this.TRANSACTION_ENDPOINT}/${id}/approve`, {});
  }

  /**
   * Reject transaction
   */
  rejectTransaction(id: string | number): Observable<ApiResponse> {
    return this.apiService.post(`${this.TRANSACTION_ENDPOINT}/${id}/reject`, {});
  }

  /**
   * Download transaction receipt as PDF (approved transactions only)
   */
  downloadTransactionReceipt(id: string | number): Observable<Blob> {
    const url = `${this.apiUrl.replace(/\/$/, '')}${this.TRANSACTION_ENDPOINT}/${id}/receipt`;
    return this.http.get(url, {
      responseType: 'blob',
      withCredentials: true
    });
  }
}

