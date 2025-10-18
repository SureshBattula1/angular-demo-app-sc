import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Holiday, HolidayFormData } from '../../../core/models/holiday.model';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  private readonly ENDPOINT = '/holidays';

  constructor(private apiService: ApiService) {}

  /**
   * Get all holidays
   */
  getHolidays(params?: Record<string, unknown>): Observable<ApiResponse<Holiday[]>> {
    return this.apiService.get<Holiday[]>(this.ENDPOINT, params);
  }

  /**
   * Get single holiday
   */
  getHoliday(id: number): Observable<ApiResponse<Holiday>> {
    return this.apiService.get<Holiday>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new holiday
   */
  createHoliday(data: HolidayFormData): Observable<ApiResponse<Holiday>> {
    return this.apiService.post<Holiday>(this.ENDPOINT, data);
  }

  /**
   * Update holiday
   */
  updateHoliday(id: number, data: Partial<HolidayFormData>): Observable<ApiResponse<Holiday>> {
    return this.apiService.put<Holiday>(`${this.ENDPOINT}/${id}`, data);
  }

  /**
   * Delete holiday
   */
  deleteHoliday(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Get upcoming holidays
   */
  getUpcoming(limit?: number): Observable<ApiResponse<Holiday[]>> {
    const params = limit ? { limit } : {};
    return this.apiService.get<Holiday[]>(`${this.ENDPOINT}/upcoming`, params);
  }

  /**
   * Get calendar data for specific month
   */
  getCalendarData(year: number, month: number): Observable<ApiResponse<Holiday[]>> {
    return this.apiService.get<Holiday[]>(`${this.ENDPOINT}/calendar/${year}/${month}`);
  }
}

