import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, ApiService } from '../../../core/services/api.service';

export interface CampaignStatusOption {
  key: string;
  label: string;
}

export interface CampaignListRow {
  id: number;
  target_id: number;
  module: string;
  branch?: string;
  grade?: string;
  section?: string;
  class_name?: string;
  class_display?: string;
  event_date?: string;
  scheduled_at?: string;
  student_count: number;
  status: string;
  sent_count: number;
  failed_count: number;
}

export interface CampaignSample {
  status_key: string;
  label: string;
  student_name: string;
  message: string;
  recipient_count: number;
}

export interface CampaignTargetInput {
  grade: string;
  section: string;
  student_count?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationCampaignService {
  constructor(private api: ApiService) {}

  modules(): Observable<ApiResponse<Record<string, CampaignStatusOption[]>>> {
    return this.api.get('/communications/notification-campaigns/modules');
  }

  dashboard(): Observable<ApiResponse<Record<string, { campaigns: number; pending: number; sent: number; failed: number; recipients: number }>>> {
    return this.api.get('/communications/notification-campaigns/dashboard');
  }

  list(params: Record<string, unknown>): Observable<ApiResponse<CampaignListRow[]>> {
    return this.api.get('/communications/notification-campaigns', params);
  }

  show(id: number | string): Observable<ApiResponse<any>> {
    return this.api.get(`/communications/notification-campaigns/${id}`);
  }

  templates(branchId: string | number): Observable<ApiResponse<Array<{ id: number; name: string; body: string; audience: string }>>> {
    return this.api.get('/communications/notification-campaigns/templates', { branch_id: branchId });
  }

  classOptions(branchId: string | number): Observable<ApiResponse<{ grades: Array<{ grade: string; label: string; student_count: number; sections: Array<{ section: string; student_count: number }> }> }>> {
    return this.api.get(`/branches/${branchId}/sms-recipient-options`);
  }

  markedAttendance(branchId: string | number, date: string): Observable<ApiResponse<Array<{ grade: string; section: string; class_name: string; student_count: number }>>> {
    return this.api.get('/communications/notification-campaigns/marked-attendance', { branch_id: branchId, date });
  }

  preview(payload: Record<string, unknown>): Observable<ApiResponse<CampaignSample[]>> {
    return this.api.post('/communications/notification-campaigns/preview', payload);
  }

  create(payload: Record<string, unknown>): Observable<ApiResponse<{ id: number }>> {
    return this.api.post('/communications/notification-campaigns', payload);
  }

  like(notificationId: number | string): Observable<ApiResponse<{ liked: boolean }>> {
    return this.api.post(`/communications/notification-campaigns/notifications/${notificationId}/like`, {});
  }
}
