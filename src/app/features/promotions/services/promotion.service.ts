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
    academic_year: string;
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
    academic_year: string;
    check_eligibility?: boolean;
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
    academic_year: string;
  }): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/preview-promotion`, data);
  }

  /**
   * Get promotion history for a student
   */
  getPromotionHistory(studentId: number): Observable<ApiResponse> {
    return this.apiService.get(`${this.ENDPOINT}/${studentId}/promotion-history`);
  }
}




