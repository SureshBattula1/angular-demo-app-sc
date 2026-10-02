import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AcademicYearContextService } from '../../../core/services/academic-year-context.service';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FeeStructure,
  FeePayment,
  StudentFees,
  FeeFilters
} from '../../../core/models/fee.model';
import { ApiResponse } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class FeeService {
  private http = inject(HttpClient);
  private academicYearContext = inject(AcademicYearContextService);
  private apiUrl = `${environment.apiUrl}`;

  // Fee Structure APIs
  getFeeStructures(filters?: FeeFilters): Observable<ApiResponse<FeeStructure[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof FeeFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<ApiResponse<FeeStructure[]>>(
      `${this.apiUrl}/fee-structures`,
      { params }
    );
  }

  getFeeStructureById(id: string | number): Observable<ApiResponse<FeeStructure>> {
    return this.http.get<ApiResponse<FeeStructure>>(
      `${this.apiUrl}/fee-structures/${id}`
    );
  }

  createFeeStructure(structure: Partial<FeeStructure>): Observable<ApiResponse<FeeStructure>> {
    return this.http.post<ApiResponse<FeeStructure>>(
      `${this.apiUrl}/fee-structures`,
      structure
    );
  }

  updateFeeStructure(id: string | number, structure: Partial<FeeStructure>): Observable<ApiResponse<FeeStructure>> {
    return this.http.put<ApiResponse<FeeStructure>>(
      `${this.apiUrl}/fee-structures/${id}`,
      structure
    );
  }

  deleteFeeStructure(id: string | number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(
      `${this.apiUrl}/fee-structures/${id}`
    );
  }

  // Fee Payment APIs
  getFeePayments(filters?: FeeFilters): Observable<ApiResponse<FeePayment[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof FeeFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<ApiResponse<FeePayment[]>>(
      `${this.apiUrl}/fee-payments`,
      { params }
    );
  }

  getFeePaymentById(id: string | number): Observable<ApiResponse<FeePayment>> {
    return this.http.get<ApiResponse<FeePayment>>(
      `${this.apiUrl}/fee-payments/${id}`
    );
  }

  recordPayment(payment: Partial<FeePayment>): Observable<ApiResponse<FeePayment>> {
    return this.http.post<ApiResponse<FeePayment>>(
      `${this.apiUrl}/fee-payments`,
      payment
    );
  }

  // Student Fees
  getStudentFees(studentId: string | number): Observable<ApiResponse<StudentFees>> {
    return this.http.get<ApiResponse<StudentFees>>(
      `${this.apiUrl}/students/${studentId}/fees`
    );
  }

  // Today's Payments
  getTodayPayments(filters?: FeeFilters): Observable<ApiResponse<FeePayment[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof FeeFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<ApiResponse<FeePayment[]>>(
      `${this.apiUrl}/fee-payments/today`,
      { params }
    );
  }

  // Per-student fee details for a Grade & Section
  getStudentFeesByClass(params: Record<string, any>): Observable<ApiResponse<any[]>> {
    let httpParams = new HttpParams();
    Object.keys(params || {}).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/fee-payments/by-class`,
      { params: httpParams }
    );
  }

  downloadFeePaymentReceipt(id: string | number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/fee-payments/${id}/receipt`,
      {
        responseType: 'blob'
      }
    );
  }

  downloadStudentFeeStatement(
    userId: string | number,
    options?: {
      scopeAll?: boolean;
      feeStructureId?: string | number;
      feeDueId?: string;
      paymentId?: string | number;
    }
  ): Observable<Blob> {
    let params = new HttpParams();
    const yearId = this.academicYearContext.effectiveYearId();
    if (yearId !== null && yearId !== undefined && yearId !== '') {
      params = params.set('academic_year_id', String(yearId));
    }
    if (options?.scopeAll) {
      params = params.set('scope', 'all');
    }
    if (options?.feeStructureId) {
      params = params.set('fee_structure_id', String(options.feeStructureId));
    }
    if (options?.feeDueId) {
      params = params.set('fee_due_id', options.feeDueId);
    }
    if (options?.paymentId) {
      params = params.set('payment_id', String(options.paymentId));
    }

    let headers = new HttpHeaders();
    if (yearId !== null && yearId !== undefined && yearId !== '') {
      headers = headers.set('X-Academic-Year-Id', String(yearId));
    }

    return this.http.get(`${this.apiUrl}/students/${userId}/fee-statement.pdf`, {
      params,
      headers,
      responseType: 'blob',
    });
  }
}

