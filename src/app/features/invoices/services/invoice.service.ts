import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import {
  Invoice,
  InvoiceFormData,
  InvoiceStats,
  PaymentData,
  TransactionSearchParams,
  GenerateInvoiceRequest
} from '../../../core/models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly ENDPOINT = '/invoices';

  constructor(private apiService: ApiService) {}

  /**
   * Get all invoices
   */
  getInvoices(params?: Record<string, unknown>): Observable<ApiResponse<Invoice[]>> {
    return this.apiService.get<Invoice[]>(this.ENDPOINT, params);
  }

  /**
   * Get single invoice
   */
  getInvoice(id: number): Observable<ApiResponse<Invoice>> {
    return this.apiService.get<Invoice>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create manual invoice
   */
  createInvoice(data: InvoiceFormData): Observable<ApiResponse<Invoice>> {
    return this.apiService.post<Invoice>(this.ENDPOINT, data);
  }

  /**
   * Update invoice
   */
  updateInvoice(id: number, data: Partial<InvoiceFormData>): Observable<ApiResponse<Invoice>> {
    return this.apiService.put<Invoice>(`${this.ENDPOINT}/${id}`, data);
  }

  /**
   * Delete invoice
   */
  deleteInvoice(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Search transactions for invoice generation
   */
  searchTransactions(params: Record<string, unknown>): Observable<ApiResponse<any[]>> {
    return this.apiService.get<any[]>(`${this.ENDPOINT}/search-transactions`, params);
  }

  /**
   * Generate invoice from transactions
   */
  generateFromTransactions(data: GenerateInvoiceRequest): Observable<ApiResponse<Invoice>> {
    return this.apiService.post<Invoice>(`${this.ENDPOINT}/generate-from-transactions`, data);
  }

  /**
   * Record payment
   */
  recordPayment(id: number, data: PaymentData): Observable<ApiResponse<Invoice>> {
    return this.apiService.post<Invoice>(`${this.ENDPOINT}/${id}/payment`, data);
  }

  /**
   * Send invoice
   */
  sendInvoice(id: number): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/${id}/send`, {});
  }

  /**
   * Get statistics
   */
  getStats(params?: Record<string, unknown>): Observable<ApiResponse<InvoiceStats>> {
    return this.apiService.get<InvoiceStats>(`${this.ENDPOINT}/stats`, params);
  }
}

