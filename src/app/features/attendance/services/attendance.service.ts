import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  StudentAttendance,
  TeacherAttendance,
  AttendanceFilters,
  BulkAttendanceRequest
} from '../../../core/models/attendance.model';
import { ApiResponse } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/attendance`;

  /**
   * Get attendance records with filters (server-side pagination)
   */
  getAttendance(filters?: AttendanceFilters): Observable<ApiResponse<(StudentAttendance | TeacherAttendance)[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof AttendanceFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<ApiResponse<(StudentAttendance | TeacherAttendance)[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get attendance by ID
   */
  getAttendanceById(id: number): Observable<ApiResponse<StudentAttendance | TeacherAttendance>> {
    return this.http.get<ApiResponse<StudentAttendance | TeacherAttendance>>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Mark bulk attendance (optimized)
   */
  markBulkAttendance(bulkData: BulkAttendanceRequest): Observable<ApiResponse<{ marked: number; errors: string[] }>> {
    return this.http.post<ApiResponse<{ marked: number; errors: string[] }>>(
      `${this.apiUrl}/bulk`,
      bulkData
    );
  }

  /**
   * Get class attendance
   */
  getClassAttendance(grade: string, section: string, date?: string): Observable<ApiResponse<{ data: StudentAttendance[]; meta: Record<string, unknown> }>> {
    let params = new HttpParams();
    
    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<ApiResponse<{ data: StudentAttendance[]; meta: Record<string, unknown> }>>(
      `${this.apiUrl}/class/${grade}/${section}`,
      { params }
    );
  }

  /**
   * Get student attendance history
   */
  getStudentAttendance(studentId: number, filters?: { from_date?: string; to_date?: string }): Observable<ApiResponse<{ data: StudentAttendance[]; summary: any }>> {
    let params = new HttpParams();
    
    if (filters?.from_date) {
      params = params.set('from_date', filters.from_date);
    }
    if (filters?.to_date) {
      params = params.set('to_date', filters.to_date);
    }

    return this.http.get<ApiResponse<{ data: StudentAttendance[]; summary: any }>>(
      `${this.apiUrl}/student/${studentId}`,
      { params }
    );
  }

  /**
   * Generate attendance report
   */
  getReport(filters: {
    type: 'student' | 'teacher';
    from_date: string;
    to_date: string;
    branch_id?: number;
    grade?: string;
    section?: string;
  }): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/report`,
      { params }
    );
  }
}

