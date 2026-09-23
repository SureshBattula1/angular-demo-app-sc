import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { FeeType, FeeTypeFormData } from '../../../core/models/fee.model';

@Injectable({
  providedIn: 'root'
})
export class FeeTypeService {
  private readonly ENDPOINT = '/fee-types';

  constructor(private apiService: ApiService) {}

  getFeeTypes(params?: Record<string, unknown>): Observable<ApiResponse<FeeType[]>> {
    return this.apiService.get<FeeType[]>(this.ENDPOINT, params);
  }

  getFeeType(id: number | string): Observable<ApiResponse<FeeType>> {
    return this.apiService.get<FeeType>(`${this.ENDPOINT}/${id}`);
  }

  createFeeType(feeTypeData: FeeTypeFormData): Observable<ApiResponse<FeeType>> {
    return this.apiService.post<FeeType>(this.ENDPOINT, feeTypeData);
  }

  updateFeeType(id: number | string, feeTypeData: Partial<FeeTypeFormData>): Observable<ApiResponse<FeeType>> {
    return this.apiService.put<FeeType>(`${this.ENDPOINT}/${id}`, feeTypeData);
  }

  deleteFeeType(id: number | string): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  toggleStatus(id: number | string): Observable<ApiResponse<FeeType>> {
    return this.apiService.put<FeeType>(`${this.ENDPOINT}/${id}/toggle-status`, {});
  }
}

