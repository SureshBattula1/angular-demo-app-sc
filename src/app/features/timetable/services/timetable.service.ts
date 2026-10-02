import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface Timetable {
  id: number;
  branch_id: number;
  grade: string;
  section?: string;
  academic_year: string;
  day_of_week: string;
  period_number: number;
  subject_id: number;
  teacher_id: number;
  room_number?: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  subject?: any;
  teacher?: any;
  branch?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TimetableService {
  private readonly ENDPOINT = '/timetables';

  constructor(private apiService: ApiService) {}

  /**
   * Get all timetables
   */
  getTimetables(params?: Record<string, unknown>): Observable<ApiResponse<Timetable[]>> {
    return this.apiService.get<Timetable[]>(this.ENDPOINT, params);
  }

  /**
   * Get timetable by ID
   */
  getTimetable(id: number): Observable<ApiResponse<Timetable>> {
    return this.apiService.get<Timetable>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Get timetable by class (grade and section)
   */
  getTimetableByClass(grade: string, section: string): Observable<ApiResponse<Timetable[]>> {
    return this.apiService.get<Timetable[]>(`${this.ENDPOINT}/class/${grade}/${section}`);
  }

  /**
   * Create new timetable entry
   */
  createTimetable(timetableData: Partial<Timetable>): Observable<ApiResponse<Timetable>> {
    return this.apiService.post<Timetable>(this.ENDPOINT, timetableData);
  }

  /**
   * Update timetable entry
   */
  updateTimetable(id: number, timetableData: Partial<Timetable>): Observable<ApiResponse<Timetable>> {
    return this.apiService.put<Timetable>(`${this.ENDPOINT}/${id}`, timetableData);
  }

  /**
   * Delete timetable entry
   */
  deleteTimetable(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }
}

