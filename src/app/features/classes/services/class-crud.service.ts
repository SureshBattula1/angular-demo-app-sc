import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Class, ClassFormData, GradeOption, SectionOption } from '../../../core/models/class.model';

@Injectable({
  providedIn: 'root'
})
export class ClassCrudService {
  private readonly ENDPOINT = '/classes';

  constructor(private apiService: ApiService) {}

  /**
   * Get all classes
   */
  getClasses(params?: Record<string, unknown>): Observable<ApiResponse<Class[]>> {
    return this.apiService.get<Class[]>(this.ENDPOINT, params);
  }

  /**
   * Get class by ID
   */
  getClass(id: number): Observable<ApiResponse<Class>> {
    return this.apiService.get<Class>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new class
   */
  createClass(classData: ClassFormData): Observable<ApiResponse<Class>> {
    return this.apiService.post<Class>(this.ENDPOINT, classData);
  }

  /**
   * Update class
   */
  updateClass(id: number, classData: Partial<ClassFormData>): Observable<ApiResponse<Class>> {
    return this.apiService.put<Class>(`${this.ENDPOINT}/${id}`, classData);
  }

  /**
   * Delete class
   */
  deleteClass(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Get available grades
   */
  getGrades(): Observable<ApiResponse<GradeOption[]>> {
    return this.apiService.get<GradeOption[]>(`${this.ENDPOINT}/grades`);
  }

  /**
   * Get available sections
   */
  getSections(): Observable<ApiResponse<SectionOption[]>> {
    return this.apiService.get<SectionOption[]>(`${this.ENDPOINT}/sections`);
  }
}

