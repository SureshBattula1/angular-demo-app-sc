import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  read_at?: string;
  created_at?: string;
}

export interface Announcement {
  id: number;
  branch_id?: number;
  title: string;
  content: string;
  target_audience: string;
  priority: 'Low' | 'Medium' | 'High';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Circular {
  id: number;
  branch_id?: number;
  title: string;
  content: string;
  target_audience: string;
  circular_number?: string;
  issue_date: string;
  expiry_date?: string;
  requires_acknowledgment: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private readonly BASE_ENDPOINT = '/communications';

  constructor(private apiService: ApiService) {}

  // Notification Methods
  getNotifications(params?: Record<string, unknown>): Observable<ApiResponse<Notification[]>> {
    return this.apiService.get<Notification[]>(`${this.BASE_ENDPOINT}/notifications`, params);
  }

  createNotification(notificationData: Partial<Notification>): Observable<ApiResponse<Notification>> {
    return this.apiService.post<Notification>(`${this.BASE_ENDPOINT}/notifications`, notificationData);
  }

  markNotificationAsRead(notificationId: number): Observable<ApiResponse<Notification>> {
    return this.apiService.post<Notification>(`${this.BASE_ENDPOINT}/notifications/${notificationId}/read`, {});
  }

  // Announcement Methods
  getAnnouncements(params?: Record<string, unknown>): Observable<ApiResponse<Announcement[]>> {
    return this.apiService.get<Announcement[]>(`${this.BASE_ENDPOINT}/announcements`, params);
  }

  getAnnouncement(id: number): Observable<ApiResponse<Announcement>> {
    return this.apiService.get<Announcement>(`${this.BASE_ENDPOINT}/announcements/${id}`);
  }

  createAnnouncement(announcementData: Partial<Announcement>): Observable<ApiResponse<Announcement>> {
    return this.apiService.post<Announcement>(`${this.BASE_ENDPOINT}/announcements`, announcementData);
  }

  updateAnnouncement(id: number, announcementData: Partial<Announcement>): Observable<ApiResponse<Announcement>> {
    return this.apiService.put<Announcement>(`${this.BASE_ENDPOINT}/announcements/${id}`, announcementData);
  }

  deleteAnnouncement(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.BASE_ENDPOINT}/announcements/${id}`);
  }

  // Circular Methods
  getCirculars(params?: Record<string, unknown>): Observable<ApiResponse<Circular[]>> {
    return this.apiService.get<Circular[]>(`${this.BASE_ENDPOINT}/circulars`, params);
  }

  getCircular(id: number): Observable<ApiResponse<Circular>> {
    return this.apiService.get<Circular>(`${this.BASE_ENDPOINT}/circulars/${id}`);
  }

  createCircular(circularData: Partial<Circular>): Observable<ApiResponse<Circular>> {
    return this.apiService.post<Circular>(`${this.BASE_ENDPOINT}/circulars`, circularData);
  }

  updateCircular(id: number, circularData: Partial<Circular>): Observable<ApiResponse<Circular>> {
    return this.apiService.put<Circular>(`${this.BASE_ENDPOINT}/circulars/${id}`, circularData);
  }

  deleteCircular(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.BASE_ENDPOINT}/circulars/${id}`);
  }

  acknowledgeCircular(circularId: number): Observable<ApiResponse<Circular>> {
    return this.apiService.post<Circular>(`${this.BASE_ENDPOINT}/circulars/${circularId}/acknowledge`, {});
  }
}

