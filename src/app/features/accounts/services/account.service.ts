import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  getCategory(id: number): Observable<ApiResponse<AccountCategory>> {
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
  updateCategory(id: number, data: Partial<AccountCategoryFormData>): Observable<ApiResponse<AccountCategory>> {
    return this.apiService.put<AccountCategory>(`${this.ENDPOINT}/categories/${id}`, data);
  }

  /**
   * Delete account category
   */
  deleteCategory(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/categories/${id}`);
  }

  /**
   * Toggle category status
   */
  toggleCategoryStatus(id: number): Observable<ApiResponse<AccountCategory>> {
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
  getTransaction(id: number): Observable<ApiResponse<Transaction>> {
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
  updateTransaction(id: number, data: Partial<TransactionFormData>): Observable<ApiResponse<Transaction>> {
    return this.apiService.put<Transaction>(`${this.TRANSACTION_ENDPOINT}/${id}`, data);
  }

  /**
   * Delete transaction
   */
  deleteTransaction(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.TRANSACTION_ENDPOINT}/${id}`);
  }

  /**
   * Approve transaction
   */
  approveTransaction(id: number): Observable<ApiResponse<Transaction>> {
    return this.apiService.post<Transaction>(`${this.TRANSACTION_ENDPOINT}/${id}/approve`, {});
  }

  /**
   * Reject transaction
   */
  rejectTransaction(id: number): Observable<ApiResponse> {
    return this.apiService.post(`${this.TRANSACTION_ENDPOINT}/${id}/reject`, {});
  }
}

