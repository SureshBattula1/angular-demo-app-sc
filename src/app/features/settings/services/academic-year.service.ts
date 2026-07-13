import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicYearFormData {
  name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  is_active?: boolean;
  description?: string | null;
}

export interface PaginatedAcademicYears {
  data: AcademicYear[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicYearService {
  private readonly ENDPOINT = '/academic-years';

  constructor(private apiService: ApiService) {}

  getList(params?: Record<string, unknown>): Observable<ApiResponse<AcademicYear[]>> {
    return this.apiService.get<AcademicYear[]>(this.ENDPOINT, params) as Observable<ApiResponse<AcademicYear[]>>;
  }

  getById(id: string | number): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.get<AcademicYear>(`${this.ENDPOINT}/${id}`);
  }

  /** Get the current (is_current = true) academic year. */
  getCurrent(): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.get<AcademicYear>(`${this.ENDPOINT}/current`);
  }

  create(data: AcademicYearFormData): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.post<AcademicYear>(this.ENDPOINT, data);
  }

  update(id: string | number, data: Partial<AcademicYearFormData>): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.put<AcademicYear>(`${this.ENDPOINT}/${id}`, data);
  }

  delete(id: string | number): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`${this.ENDPOINT}/${id}`);
  }
}
