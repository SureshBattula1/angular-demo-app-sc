import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * OPTIMIZED: Get comprehensive dashboard stats with date range filter
   * Single API call replaces multiple calls for better performance
   */
  getComprehensiveStats(params: {
    period?: 'today' | 'week' | 'month' | 'custom';
    from_date?: string;
    to_date?: string;
    branch_id?: number;
  }): Observable<DashboardResponse> {
    let httpParams = new HttpParams();
    
    if (params.period) {
      httpParams = httpParams.set('period', params.period);
    }
    if (params.from_date) {
      httpParams = httpParams.set('from_date', params.from_date);
    }
    if (params.to_date) {
      httpParams = httpParams.set('to_date', params.to_date);
    }
    if (params.branch_id) {
      httpParams = httpParams.set('branch_id', params.branch_id.toString());
    }
    
    return this.http.get<DashboardResponse>(`${this.apiUrl}/stats`, { params: httpParams });
  }

}

