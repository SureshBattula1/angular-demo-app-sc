import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface ExamSchedule {
  id: number;
  exam_id: string;
  subject_id: number;
  branch_id?: number;
  grade: string;
  grade_level?: string;
  section: string | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration?: number;
  total_marks: number;
  passing_marks?: number;
  room_number?: string | null;
  invigilator_id?: number | null;
  instructions?: string;
  status?: string;
  is_active?: boolean;
  exam?: any;
  subject?: any;
  branch?: any;
  invigilator?: any;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExamScheduleService {
  private readonly ENDPOINT = '/exam-schedules';

  constructor(private apiService: ApiService) {}

  getSchedules(params?: Record<string, unknown>): Observable<ApiResponse<ExamSchedule[]>> {
    return this.apiService.get<ExamSchedule[]>(this.ENDPOINT, params);
  }

  getSchedule(id: number): Observable<ApiResponse<ExamSchedule>> {
    return this.apiService.get<ExamSchedule>(`${this.ENDPOINT}/${id}`);
  }

  createSchedule(data: Partial<ExamSchedule>): Observable<ApiResponse<ExamSchedule>> {
    return this.apiService.post<ExamSchedule>(this.ENDPOINT, data);
  }

  updateSchedule(id: number, data: Partial<ExamSchedule>): Observable<ApiResponse<ExamSchedule>> {
    return this.apiService.put<ExamSchedule>(`${this.ENDPOINT}/${id}`, data);
  }

  deleteSchedule(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  getStudents(id: number): Observable<ApiResponse<any[]>> {
    return this.apiService.get<any[]>(`${this.ENDPOINT}/${id}/students`);
  }
}

