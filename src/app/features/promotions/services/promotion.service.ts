import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly ENDPOINT = '/students';

  constructor(private apiService: ApiService) {}

  /**
   * Promote students (basic promotion)
   */
  promoteStudents(data: {
    student_ids: number[];
    from_grade: string;
    to_grade: string;
    to_academic_year_id: number;
    from_section?: string;
    to_section?: string;
  }): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/promote`, data);
  }

  /**
   * Promote students with fee handling and carry-forward
   */
  promoteStudentsWithFeeHandling(data: {
    student_ids: number[];
    from_grade: string;
    to_grade: string;
    to_academic_year_id: number;
    from_academic_year_id?: number;
    check_eligibility?: boolean;
    from_section?: string;
    to_section?: string;
  }): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/promote-with-fee-handling`, data);
  }

  /**
   * Preview promotion impact before executing
   */
  previewPromotion(data: {
    student_ids: number[];
    from_grade: string;
    to_grade: string;
    to_academic_year_id: number;
    academic_year?: string;
    from_section?: string;
    to_section?: string;
  }): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/preview-promotion`, data);
  }

  /**
   * Revert (unpromote) students back to a previous grade
   */
  revertPromotion(data: {
    student_ids: number[];
    academic_year_id: number;
    from_grade: string;
    to_grade: string;
    from_section?: string;
    to_section?: string;
  }): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/revert-promotion`, data);
  }

  /**
   * Get promotion history for a student
   */
  getPromotionHistory(studentId: number): Observable<ApiResponse> {
    return this.apiService.get(`${this.ENDPOINT}/${studentId}/promotion-history`);
  }
}






