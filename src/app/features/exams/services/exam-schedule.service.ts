import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface ExamSchedule {
  // IDs are opaque hashid strings when HASHIDS_ENABLED is on — never Number() them.
  id: string;
  exam_id: string;
  batch_uuid?: string | null;
  subject_id: string;
  branch_id?: string;
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
  invigilator_id?: string | null;
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

  getSchedule(id: string | number): Observable<ApiResponse<ExamSchedule>> {
    return this.apiService.get<ExamSchedule>(`${this.ENDPOINT}/${id}`);
  }

  createSchedule(data: Partial<ExamSchedule>): Observable<ApiResponse<ExamSchedule>> {
    return this.apiService.post<ExamSchedule>(this.ENDPOINT, data);
  }

  createSchedulesBulk(payload: ExamScheduleBulkCreatePayload): Observable<ApiResponse<ExamScheduleBulkCreateResult>> {
    return this.apiService.post<ExamScheduleBulkCreateResult>(`${this.ENDPOINT}/bulk`, payload);
  }

  updateSchedule(id: string | number, data: Partial<ExamSchedule>): Observable<ApiResponse<ExamSchedule>> {
    return this.apiService.put<ExamSchedule>(`${this.ENDPOINT}/${id}`, data);
  }

  deleteSchedule(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  getStudents(id: string | number): Observable<ApiResponse<any[]>> {
    return this.apiService.get<any[]>(`${this.ENDPOINT}/${id}/students`);
  }
}

export interface ExamScheduleBulkRowPayload {
  subject_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration?: number | string | null;
  total_marks: number;
  passing_marks?: number | null;
  room_number?: string | null;
  invigilator_id?: string | null;
  instructions?: string | null;
}

export interface ExamScheduleBulkCreatePayload {
  exam_id: string;
  grade_level: string;
  section: string;
  schedules: ExamScheduleBulkRowPayload[];
}

export interface ExamScheduleBulkCreateResult {
  batch_uuid: string;
  created: ExamSchedule[];
  skipped: { subject_id: string | number; reason: string }[];
}

