import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Leave, LeaveResponse } from '../../../core/models/leave.model';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = `${environment.apiUrl}/leaves`;

  constructor(private http: HttpClient) {}

  /**
   * Get all leaves with optional filters
   */
  getLeaves(filters?: Record<string, any>): Observable<LeaveResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }
    
    return this.http.get<LeaveResponse>(this.apiUrl, { params });
  }

  /**
   * Get single leave by ID
   */
  getLeave(id: string | number, type?: 'student' | 'teacher'): Observable<LeaveResponse> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<LeaveResponse>(`${this.apiUrl}/${id}`, { params });
  }

  /**
   * Create new leave
   */
  createLeave(leave: Partial<Leave>): Observable<LeaveResponse> {
    return this.http.post<LeaveResponse>(this.apiUrl, leave);
  }

  /**
   * Update existing leave
   */
  updateLeave(id: string | number, leave: Partial<Leave>): Observable<LeaveResponse> {
    return this.http.put<LeaveResponse>(`${this.apiUrl}/${id}`, leave);
  }

  /**
   * Delete leave
   */
  deleteLeave(id: string | number, type: 'student' | 'teacher'): Observable<LeaveResponse> {
    const params = new HttpParams().set('type', type);
    return this.http.delete<LeaveResponse>(`${this.apiUrl}/${id}`, { params });
  }

  /**
   * Get student leaves by student ID
   */
  getStudentLeaves(studentId: string | number, filters?: Record<string, any>): Observable<LeaveResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }
    
    return this.http.get<LeaveResponse>(`${this.apiUrl}/student/${studentId}`, { params });
  }

  /**
   * Get teacher leaves by teacher ID
   */
  getTeacherLeaves(teacherId: string | number, filters?: Record<string, any>): Observable<LeaveResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }
    
    return this.http.get<LeaveResponse>(`${this.apiUrl}/teacher/${teacherId}`, { params });
  }

  /**
   * Approve leave
   */
  approveLeave(id: string | number, type: 'student' | 'teacher', remarks?: string): Observable<LeaveResponse> {
    return this.http.put<LeaveResponse>(`${this.apiUrl}/${id}`, {
      status: 'Approved',
      remarks,
      type
    });
  }

  /**
   * Reject leave
   */
  rejectLeave(id: string | number, type: 'student' | 'teacher', remarks?: string): Observable<LeaveResponse> {
    return this.http.put<LeaveResponse>(`${this.apiUrl}/${id}`, {
      status: 'Rejected',
      remarks,
      type
    });
  }

  /**
   * Cancel leave
   */
  cancelLeave(id: string | number, type: 'student' | 'teacher', remarks?: string): Observable<LeaveResponse> {
    return this.http.put<LeaveResponse>(`${this.apiUrl}/${id}`, {
      status: 'Cancelled',
      remarks,
      type
    });
  }
}

