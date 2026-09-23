import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CompanyApiService, ApiResponse } from './company-api.service';
import { Company } from '../../core/models/school.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  // Reactive state
  public companies = signal<Company[]>([]);
  public currentCompany = signal<Company | null>(null);

  constructor(
    private companyApiService: CompanyApiService
  ) {}

  /**
   * Get all companies
   */
  getCompanies(params?: any): Observable<ApiResponse<Company[]>> {
    return this.companyApiService.get<Company[]>('/companies', params).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.companies.set(response.data);
        }
      })
    );
  }

  /**
   * Get company by ID
   */
  getCompany(id: string | number): Observable<ApiResponse<Company>> {
    return this.companyApiService.get<Company>(`/companies/${id}`);
  }

  /**
   * Create new company
   */
  createCompany(data: Partial<Company>): Observable<ApiResponse<Company>> {
    return this.companyApiService.post<Company>('/companies', data);
  }

  /**
   * Update company
   */
  updateCompany(id: string | number, data: Partial<Company>): Observable<ApiResponse<Company>> {
    return this.companyApiService.put<Company>(`/companies/${id}`, data);
  }

  /**
   * Delete company
   */
  deleteCompany(id: string | number): Observable<ApiResponse<void>> {
    return this.companyApiService.delete<void>(`/companies/${id}`);
  }
}

