import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface SectionSubjectAssignment {
  // IDs are opaque hashid strings when HASHIDS_ENABLED is on — never Number() them.
  id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string | null;
  branch_id: string;
  academic_year_id?: string | null;
  academic_year: string;
  is_active: boolean;
  section?: any;
  subject?: any;
  teacher?: any;
  created_at?: string;
  updated_at?: string;
}

export interface BulkAssignmentRequest {
  section_id: number | string;
  subjects: {
    subject_id: number | string;
    teacher_id?: number | string;
  }[];
  branch_id: number | string;
  academic_year_id: number | string;
  academic_year: string;
}

export interface CopySubjectsRequest {
  from_section_id: number | string;
  to_section_ids: (number | string)[];
  academic_year_id: number | string;
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
  getSectionSubjects(sectionId: string | number, academicYearId?: number | null, academicYear?: string): Observable<SectionSubjectsResponse> {
    const params: Record<string, unknown> = {};
    if (academicYearId) params['academic_year_id'] = academicYearId;
    if (academicYear) params['academic_year'] = academicYear;
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
  updateAssignment(id: string | number, data: Partial<SectionSubjectAssignment>): Observable<ApiResponse<SectionSubjectAssignment>> {
    return this.apiService.put<SectionSubjectAssignment>(`${this.ENDPOINT}/${id}`, data);
  }

  /**
   * Remove subject from section
   */
  removeSubject(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }
}

