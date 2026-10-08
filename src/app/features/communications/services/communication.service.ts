import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface NotificationAttachment {
  id?: string | number;
  name?: string;
  url?: string;
  file_name?: string;
  original_name?: string;
  file_path?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  mime?: string;
  size?: number;
}

export interface AppNotification {
  id: number | string;
  user_id?: number;
  title: string;
  message: string;
  description?: string;
  optional_description?: string;
  type?: string;
  priority?: string;
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string;
  date?: string;
  sent_at?: string;
  source?: string;
  event?: string;
  group_key?: string;
  assignment_id?: number | string | null;
  action_url?: string | null;
  can_view_receipts?: boolean;
  grade?: string | null;
  section?: string | null;
  audience?: string | null;
  student_count?: number | null;
  status?: string | null;
  attachments?: NotificationAttachment[];
  campaign_id?: number | null;
  module?: string | null;
  status_key?: string | null;
  liked?: boolean;
  campaign_viewed?: boolean;
}

export interface NotificationViewer {
  user_id: number | string;
  name: string;
  role?: string | null;
  audience?: string | null;
  viewed: boolean;
  viewed_at?: string | null;
}

export interface NotificationReceipts {
  group_key?: string | null;
  total: number;
  viewed: number;
  pending: number;
  percent: number;
  viewers: NotificationViewer[];
}

export interface BroadcastTarget {
  grade: string;
  section: string;
}

export interface BroadcastNotificationBody {
  title: string;
  description: string;
  optional_description?: string | null;
  /** Legacy single class */
  grade?: string;
  section?: string;
  audience_mode?: 'all' | 'custom';
  include_students?: boolean;
  include_staff?: boolean;
  student_audience_mode?: 'all' | 'custom';
  staff_audience_mode?: 'all' | 'custom';
  targets?: BroadcastTarget[];
  student_ids?: number[];
  staff_user_ids?: number[];
  attachments?: NotificationAttachment[];
  branch_id?: number | null;
}

export interface StaffRecipientGroup {
  key: string;
  label: string;
  people: {
    user_id: number;
    name: string;
    subtitle: string;
  }[];
}

export interface BroadcastNotificationResult {
  group_key?: string;
  grade?: string;
  section?: string;
  class_name?: string;
  student_count?: number;
  staff_count?: number;
  recipient_count?: number;
  sent_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private readonly BASE_ENDPOINT = '/communications';

  constructor(private apiService: ApiService) {}

  /** Inbox — same as mobile app */
  getNotifications(params?: Record<string, unknown>): Observable<ApiResponse<AppNotification[]>> {
    return this.apiService.get<AppNotification[]>(`${this.BASE_ENDPOINT}/notifications`, params);
  }

  getNotification(notificationId: number | string): Observable<ApiResponse<AppNotification>> {
    return this.apiService.get<AppNotification>(`${this.BASE_ENDPOINT}/notifications/${notificationId}`);
  }

  getUnreadNotificationCount(): Observable<ApiResponse<{ unread: number }>> {
    return this.apiService.get<{ unread: number }>(`${this.BASE_ENDPOINT}/notifications/unread-count`);
  }

  markNotificationAsRead(notificationId: number | string): Observable<ApiResponse<AppNotification>> {
    return this.apiService.post<AppNotification>(
      `${this.BASE_ENDPOINT}/notifications/${notificationId}/read`,
      {}
    );
  }

  markAllAsRead(): Observable<ApiResponse> {
    return this.apiService.post(`${this.BASE_ENDPOINT}/notifications/read-all`, {});
  }

  /** Teacher/admin compose — fan-out to students */
  broadcastNotification(
    body: BroadcastNotificationBody
  ): Observable<ApiResponse<BroadcastNotificationResult>> {
    return this.apiService.post<BroadcastNotificationResult>(
      `${this.BASE_ENDPOINT}/notifications/broadcast`,
      body
    );
  }

  composeStaffRecipientOptions(
    branchId: number | string
  ): Observable<ApiResponse<{ groups: StaffRecipientGroup[] }>> {
    return this.apiService.get<{ groups: StaffRecipientGroup[] }>(
      `${this.BASE_ENDPOINT}/notifications/compose/staff-recipient-options`,
      { branch_id: branchId }
    );
  }

  getSentNotifications(): Observable<ApiResponse<AppNotification[]>> {
    return this.apiService.get<AppNotification[]>(`${this.BASE_ENDPOINT}/notifications/sent`);
  }

  getNotificationReceipts(groupKey: string): Observable<ApiResponse<NotificationReceipts>> {
    return this.apiService.get<NotificationReceipts>(
      `${this.BASE_ENDPOINT}/notifications/receipts`,
      { group_key: groupKey }
    );
  }

  // Legacy single create (kept for compatibility)
  createNotification(notificationData: Partial<AppNotification>): Observable<ApiResponse<AppNotification>> {
    return this.apiService.post<AppNotification>(
      `${this.BASE_ENDPOINT}/notifications`,
      notificationData
    );
  }

  // Announcements / circulars (existing)
  getAnnouncements(params?: Record<string, unknown>): Observable<ApiResponse> {
    return this.apiService.get(`${this.BASE_ENDPOINT}/announcements`, params);
  }

  getCirculars(params?: Record<string, unknown>): Observable<ApiResponse> {
    return this.apiService.get(`${this.BASE_ENDPOINT}/circulars`, params);
  }
}
