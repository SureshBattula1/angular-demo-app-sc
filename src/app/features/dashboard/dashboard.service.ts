import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  students?: number;
  teachers?: number;
  parents?: number;
  totalMoney?: number;
  attendance?: number;
  exams?: number;
  events?: number;
  pendingFees?: number;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}

export interface AttendanceData {
  date: string;
  status: string;
  studentName?: string;
}

export interface UpcomingExam {
  id: number;
  name: string;
  subject: string;
  exam_date: string;
  exam_time: string;
  total_marks: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/stats`);
  }

  getAttendance(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/attendance?limit=${limit}`);
  }

  getTopPerformers(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/top-performers?limit=${limit}`);
  }

  getLowAttendance(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/low-attendance?limit=${limit}`);
  }

  getUpcomingExams(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/upcoming-exams?limit=${limit}`);
  }

  getStudentResults(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student-results`);
  }
}

