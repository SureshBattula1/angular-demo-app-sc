import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { ClassSection, Grade, Section, ClassListResponse } from '../../../core/models/class-section.model';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private readonly ENDPOINT = '/classes';

  constructor(private apiService: ApiService) {}

  /**
   * Get all classes (grade-section combinations)
   */
  getClasses(params?: Record<string, unknown>): Observable<ClassListResponse> {
    return this.apiService.get<ClassSection[]>(this.ENDPOINT, params).pipe(
      map(response => ({
        success: response.success,
        data: response.data || [],
        count: response.data?.length || 0
      }))
    );
  }

  /**
   * Get all grades
   */
  getGrades(branchId?: number): Observable<ApiResponse<Grade[]>> {
    const params = branchId ? { branch_id: branchId } : {};
    return this.apiService.get<Grade[]>(`${this.ENDPOINT}/grades`, params);
  }

  /**
   * Get sections for a specific grade
   */
  getSections(grade: string, branchId?: number): Observable<ApiResponse<Section[]>> {
    const params = branchId ? { branch_id: branchId } : {};
    return this.apiService.get<Section[]>(`${this.ENDPOINT}/${grade}/sections`, params);
  }

  /**
   * Get students in a class
   */
  getClassStudents(grade: string, section: string | null, params?: Record<string, unknown>): Observable<ApiResponse> {
    const sectionParam = section || 'null';
    return this.apiService.get(`${this.ENDPOINT}/${grade}/${sectionParam}/students`, params);
  }
}

