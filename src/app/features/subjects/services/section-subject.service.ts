import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface SectionSubjectAssignment {
  id: number;
  section_id: number;
  subject_id: number;
  teacher_id: number | null;
  branch_id: number;
  academic_year: string;
  is_active: boolean;
  section?: any;
  subject?: any;
  teacher?: any;
  created_at?: string;
  updated_at?: string;
}

export interface BulkAssignmentRequest {
  section_id: number;
  subjects: {
    subject_id: number;
    teacher_id?: number;
  }[];
  branch_id: number;
  academic_year: string;
}

export interface CopySubjectsRequest {
  from_section_id: number;
  to_section_ids: number[];
  academic_year: string;
  copy_teachers: boolean;
}

export interface SectionSubjectsResponse extends ApiResponse<any> {
  section?: any;
  subjects?: SectionSubjectAssignment[];
}

@Injectable({
  providedIn: 'root'
})
export class SectionSubjectService {
  private readonly ENDPOINT = '/section-subjects';

  constructor(private apiService: ApiService) {}

  /**
   * Get all section-subject assignments with pagination
   */
  getAssignments(params?: Record<string, unknown>): Observable<ApiResponse<SectionSubjectAssignment[]>> {
    return this.apiService.get<SectionSubjectAssignment[]>(this.ENDPOINT, params);
  }

  /**
   * Get subjects assigned to a section
   */
  getSectionSubjects(sectionId: number, academicYear?: string): Observable<SectionSubjectsResponse> {
    const params = academicYear ? { academic_year: academicYear } : {};
    return this.apiService.get<any>(`/sections/${sectionId}/subjects`, params);
  }

  /**
   * Assign single subject to section
   */
  assignSubject(data: Partial<SectionSubjectAssignment>): Observable<ApiResponse<SectionSubjectAssignment>> {
    return this.apiService.post<SectionSubjectAssignment>(this.ENDPOINT, data);
  }

  /**
   * Bulk assign subjects to section
   */
  bulkAssign(data: BulkAssignmentRequest): Observable<ApiResponse<any>> {
    return this.apiService.post<any>(`${this.ENDPOINT}/bulk`, data);
  }

  /**
   * Copy subjects from one section to others
   */
  copySubjects(data: CopySubjectsRequest): Observable<ApiResponse<any>> {
    return this.apiService.post<any>(`${this.ENDPOINT}/copy`, data);
  }

  /**
   * Update assignment (change teacher)
   */
  updateAssignment(id: number, data: Partial<SectionSubjectAssignment>): Observable<ApiResponse<SectionSubjectAssignment>> {
    return this.apiService.put<SectionSubjectAssignment>(`${this.ENDPOINT}/${id}`, data);
  }

  /**
   * Remove subject from section
   */
  removeSubject(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }
}

