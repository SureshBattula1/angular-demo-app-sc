import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface Event {
  id: number;
  branch_id: number;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  organizer?: string;
  is_all_day: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  branch?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly ENDPOINT = '/events';

  constructor(private apiService: ApiService) {}

  /**
   * Get all events
   */
  getEvents(params?: Record<string, unknown>): Observable<ApiResponse<Event[]>> {
    return this.apiService.get<Event[]>(this.ENDPOINT, params);
  }

  /**
   * Get event by ID
   */
  getEvent(id: number): Observable<ApiResponse<Event>> {
    return this.apiService.get<Event>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Get upcoming events
   */
  getUpcomingEvents(params?: Record<string, unknown>): Observable<ApiResponse<Event[]>> {
    return this.apiService.get<Event[]>(`${this.ENDPOINT}/upcoming`, params);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: string): Observable<ApiResponse<Event[]>> {
    return this.apiService.get<Event[]>(`${this.ENDPOINT}/by-type/${type}`);
  }

  /**
   * Create new event
   */
  createEvent(eventData: Partial<Event>): Observable<ApiResponse<Event>> {
    return this.apiService.post<Event>(this.ENDPOINT, eventData);
  }

  /**
   * Update event
   */
  updateEvent(id: number, eventData: Partial<Event>): Observable<ApiResponse<Event>> {
    return this.apiService.put<Event>(`${this.ENDPOINT}/${id}`, eventData);
  }

  /**
   * Delete event
   */
  deleteEvent(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }
}

