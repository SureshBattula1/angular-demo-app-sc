import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface Exam {
  id: string;
  exam_term_id?: number;
  branch_id: string;
  name: string;
  exam_type: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  total_marks?: number;
  passing_marks?: number;
  description?: string;
  is_active: boolean;
  branch?: any;
  exam_term?: any;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private readonly ENDPOINT = '/exams';

  constructor(private apiService: ApiService) {}

  getExams(params?: Record<string, unknown>): Observable<ApiResponse<Exam[]>> {
    return this.apiService.get<Exam[]>(this.ENDPOINT, params);
  }

  getExam(id: string | number): Observable<ApiResponse<Exam>> {
    return this.apiService.get<Exam>(`${this.ENDPOINT}/${id}`);
  }

  createExam(data: Partial<Exam>): Observable<ApiResponse<Exam>> {
    return this.apiService.post<Exam>(this.ENDPOINT, data);
  }

  updateExam(id: string | number, data: Partial<Exam>): Observable<ApiResponse<Exam>> {
    return this.apiService.put<Exam>(`${this.ENDPOINT}/${id}`, data);
  }

  deleteExam(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  getExamStatistics(id: string | number): Observable<ApiResponse> {
    return this.apiService.get(`${this.ENDPOINT}/${id}/statistics`);
  }

  getExamResults(id: string | number): Observable<ApiResponse> {
    return this.apiService.get(`${this.ENDPOINT}/${id}/results`);
  }
}

