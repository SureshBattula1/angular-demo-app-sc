import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
}

