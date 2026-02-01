import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CompanyApiService, ApiResponse } from './company-api.service';
import { School } from '../../core/models/school.model';

@Injectable({
  providedIn: 'root'
})
export class CompanySchoolService {
  // Reactive state
  public schools = signal<School[]>([]);
  public currentSchool = signal<School | null>(null);

  constructor(
    private companyApiService: CompanyApiService
  ) {}

  /**
   * Get all schools for current company
   */
  getSchools(params?: any): Observable<ApiResponse<School[]>> {
    return this.companyApiService.get<School[]>('/schools', params).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.schools.set(response.data);
        }
      })
    );
  }

  /**
   * Get school by ID
   */
  getSchool(id: number): Observable<ApiResponse<School>> {
    return this.companyApiService.get<School>(`/schools/${id}`);
  }

  /**
   * Create new school
   */
  createSchool(data: Partial<School>): Observable<ApiResponse<School>> {
    return this.companyApiService.post<School>('/schools', data).pipe(
      tap(response => {
        if (response.success && response.data) {
          const schools = this.schools();
          this.schools.set([...schools, response.data!]);
        }
      })
    );
  }

  /**
   * Update school
   */
  updateSchool(id: number, data: Partial<School>): Observable<ApiResponse<School>> {
    return this.companyApiService.put<School>(`/schools/${id}`, data).pipe(
      tap(response => {
        if (response.success && response.data) {
          const schools = this.schools();
          const index = schools.findIndex(s => s.id === id);
          if (index !== -1) {
            schools[index] = response.data!;
            this.schools.set([...schools]);
          }
        }
      })
    );
  }

  /**
   * Delete school
   */
  deleteSchool(id: number): Observable<ApiResponse<void>> {
    return this.companyApiService.delete<void>(`/schools/${id}`).pipe(
      tap(response => {
        if (response.success) {
          const schools = this.schools().filter(s => s.id !== id);
          this.schools.set(schools);
        }
      })
    );
  }

  /**
   * Activate school
   */
  activateSchool(id: number): Observable<ApiResponse<School>> {
    return this.companyApiService.put<School>(`/schools/${id}/activate`, {});
  }

  /**
   * Deactivate school
   */
  deactivateSchool(id: number): Observable<ApiResponse<School>> {
    return this.companyApiService.put<School>(`/schools/${id}/deactivate`, {});
  }

  /**
   * Get school statistics
   */
  getSchoolStatistics(id: number): Observable<ApiResponse<any>> {
    return this.companyApiService.get<any>(`/schools/${id}/statistics`);
  }
}

