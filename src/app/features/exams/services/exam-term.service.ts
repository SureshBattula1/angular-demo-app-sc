import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface ExamTerm {
  // IDs are opaque hashid strings when HASHIDS_ENABLED is on — never Number() them.
  id: string;
  name: string;
  code: string;
  branch_id: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  weightage: number;
  description?: string;
  is_active: boolean;
  branch?: any;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExamTermService {
  private readonly ENDPOINT = '/exam-terms';

  constructor(private apiService: ApiService) {}

  getExamTerms(params?: Record<string, unknown>): Observable<ApiResponse<ExamTerm[]>> {
    return this.apiService.get<ExamTerm[]>(this.ENDPOINT, params);
  }

  getExamTerm(id: string | number): Observable<ApiResponse<ExamTerm>> {
    return this.apiService.get<ExamTerm>(`${this.ENDPOINT}/${id}`);
  }

  createExamTerm(data: Partial<ExamTerm>): Observable<ApiResponse<ExamTerm>> {
    return this.apiService.post<ExamTerm>(this.ENDPOINT, data);
  }

  updateExamTerm(id: string | number, data: Partial<ExamTerm>): Observable<ApiResponse<ExamTerm>> {
    return this.apiService.put<ExamTerm>(`${this.ENDPOINT}/${id}`, data);
  }

  deleteExamTerm(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }
}

