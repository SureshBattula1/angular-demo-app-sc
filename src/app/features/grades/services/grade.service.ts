import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Grade, GradeListResponse, GradeStats, GradeFormData } from '../../../core/models/grade.model';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private readonly ENDPOINT = '/classes';
  private readonly GRADE_ENDPOINT = '/grades';

  constructor(private apiService: ApiService) {}

  /**
   * Get all grades
   * If branch_id is provided, uses /classes/grades endpoint which supports branch filtering
   */
  getGrades(params?: Record<string, unknown>): Observable<GradeListResponse> {
    // Use /classes/grades endpoint if branch_id is provided (supports branch filtering)
    const endpoint = (params && params['branch_id']) ? `${this.ENDPOINT}/grades` : this.GRADE_ENDPOINT;
    
    return this.apiService.get<Grade[]>(endpoint, params).pipe(
      map(response => ({
        success: response.success,
        data: response.data || [],
        count: response.data?.length || 0,
        total: response.data?.length || 0,
        meta: response.meta || undefined
      }))
    );
  }

  /**
   * Get single grade by value
   */
  getGrade(gradeValue: string, params?: Record<string, unknown>): Observable<ApiResponse<Grade>> {
    return this.apiService.get<Grade>(`${this.GRADE_ENDPOINT}/${gradeValue}`, params);
  }

  /**
   * Create new grade
   */
  createGrade(data: GradeFormData): Observable<ApiResponse<Grade>> {
    return this.apiService.post<Grade>(this.GRADE_ENDPOINT, data);
  }

  /**
   * Update existing grade
   */
  updateGrade(gradeValue: string, data: GradeFormData, params?: Record<string, unknown>): Observable<ApiResponse<Grade>> {
    return this.apiService.put<Grade>(`${this.GRADE_ENDPOINT}/${gradeValue}`, data, params);
  }

  /**
   * Delete grade
   */
  deleteGrade(gradeValue: string, params?: Record<string, unknown>): Observable<ApiResponse> {
    return this.apiService.delete(`${this.GRADE_ENDPOINT}/${gradeValue}`, params);
  }

  /**
   * Get grade statistics
   */
  getGradeStats(grade: string): Observable<ApiResponse<GradeStats>> {
    return this.apiService.get<GradeStats>(`${this.ENDPOINT}/grade/${grade}/stats`);
  }

  /**
   * Get students by grade
   */
  getGradeStudents(grade: string, params?: Record<string, unknown>): Observable<ApiResponse> {
    return this.apiService.get(`${this.ENDPOINT}/grade/${grade}/students`, params);
  }

  /**
   * Get sections for a grade
   */
  getGradeSections(grade: string, branchId?: number): Observable<ApiResponse> {
    const params = branchId ? { branch_id: branchId } : {};
    return this.apiService.get(`${this.ENDPOINT}/${grade}/sections`, params);
  }
}

