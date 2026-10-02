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
  campaign_status?: string;
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

export type SectionNotificationStatus = 'not_sent' | 'sending' | 'sent' | 'partial' | 'failed';

export interface CampaignModuleMeta {
  label: string;
  requires_event_date: boolean;
  confirm_selection: boolean;
  event_date_policy?: 'today_only' | 'today_or_future' | 'any';
}

export interface SectionDeliveryInfo {
  notification_status: SectionNotificationStatus;
  campaign_id?: number;
  sent_count?: number;
}

export interface SectionAttendanceSummary {
  enrolled_count: number;
  marked_count: number;
  present: number;
  absent: number;
  leave: number;
}

export interface SectionExamSummary {
  grade?: string;
  section?: string;
  student_count: number;
  schedule_count: number;
  marks_count: number;
}

export type ExamNotifyMode = 'scheduled' | 'result';
export type FeeNotifyMode = 'structure' | 'due';

export interface ExamNotifyOption {
  exam_id: number | string;
  name: string;
  academic_year?: string | null;
  list_state: 'active' | 'closed';
  selectable: boolean;
}

export interface FeeTypeOption {
  fee_type: string;
  label: string;
  unpaid_student_count: number;
  list_state: 'active' | 'closed';
  selectable: boolean;
}

export interface FeeStructureOption {
  fee_structure_id: string;
  label: string;
  grade: string;
  fee_type: string;
  due_date?: string | null;
  amount: string;
  list_state: 'active' | 'closed';
  selectable: boolean;
}

export interface SectionFeeSummary {
  grade?: string;
  section?: string;
  unpaid_count: number;
  overdue_count: number;
  matched_student_count?: number;
}

export interface SectionFeeStructureSummary {
  grade?: string;
  section?: string;
  enrolled_count: number;
  structure_applies: boolean;
}

export interface EligibleTargetRow {
  grade: string;
  section: string;
  class_name: string;
  student_count: number;
  notification_status?: SectionNotificationStatus;
  campaign_id?: number;
  sent_count?: number;
}

export type EligibleTargetsResponse = Omit<ApiResponse<EligibleTargetRow[]>, 'meta'> & {
  meta?: {
    event_date?: string;
    delivery_by_section?: Record<string, SectionDeliveryInfo>;
    attendance_by_section?: Record<string, SectionAttendanceSummary>;
    exam_by_section?: Record<string, SectionExamSummary>;
    exam_options?: ExamNotifyOption[];
    exam_schedule_dates?: string[];
    fee_notify_mode?: FeeNotifyMode;
    fee_type_options?: FeeTypeOption[];
    fee_structure_options?: FeeStructureOption[];
    fee_due_dates?: string[];
    fee_by_section?: Record<string, SectionFeeSummary | SectionFeeStructureSummary>;
    assignment_status_keys?: string[];
  };
};

export type CampaignModulesResponse = Omit<ApiResponse<Record<string, CampaignStatusOption[]>>, 'meta'> & {
  meta?: Record<string, CampaignModuleMeta>;
};

export interface CampaignModuleDashboardStats {
  campaigns: number;
  pending: number;
  sent: number;
  failed: number;
  recipients: number;
}

export interface CampaignDashboardTotals {
  campaigns: number;
  pending: number;
  sent: number;
  failed: number;
  recipients: number;
}

export interface CampaignDashboardRecentRow {
  id: number;
  module: string;
  branch_name?: string | null;
  status: string;
  scheduled_at?: string | null;
  recipient_count: number;
}

export interface CampaignDashboardActivityDay {
  date: string;
  campaigns: number;
}

export interface CampaignDashboardPayload {
  by_module: Record<string, CampaignModuleDashboardStats>;
  totals: CampaignDashboardTotals;
  status_breakdown: { sent: number; pending: number; failed: number };
  recent: CampaignDashboardRecentRow[];
  activity_by_day: CampaignDashboardActivityDay[];
}

@Injectable({ providedIn: 'root' })
export class NotificationCampaignService {
  constructor(private api: ApiService) {}

  modules(): Observable<CampaignModulesResponse> {
    return this.api.get<Record<string, CampaignStatusOption[]>>(
      '/communications/notification-campaigns/modules'
    ) as Observable<CampaignModulesResponse>;
  }

  dashboard(params?: {
    branch_id?: string | number;
    from?: string;
    to?: string;
    /** core = KPIs/modules/charts data; extras = recent + activity; all = both */
    include?: 'all' | 'core' | 'extras';
  }): Observable<ApiResponse<Partial<CampaignDashboardPayload>>> {
    return this.api.get('/communications/notification-campaigns/dashboard', params ?? {});
  }

  list(params: Record<string, unknown>): Observable<ApiResponse<CampaignListRow[]>> {
    return this.api.get('/communications/notification-campaigns', params);
  }

  show(id: number | string): Observable<ApiResponse<any>> {
    return this.api.get(`/communications/notification-campaigns/${id}`);
  }

  templates(branchId: string | number): Observable<ApiResponse<{ id: number; name: string; body: string; audience: string }[]>> {
    return this.api.get('/communications/notification-campaigns/templates', { branch_id: branchId });
  }

  classOptions(branchId: string | number): Observable<ApiResponse<{ grades: { grade: string; label: string; student_count: number; sections: { section: string; student_count: number }[] }[] }>> {
    return this.api.get('/communications/notification-campaigns/class-options', { branch_id: branchId });
  }

  feesDueNotifyMeta(
    branchId: string | number,
    feeType?: string
  ): Observable<
    ApiResponse<{
      fee_type_options: FeeTypeOption[];
      fee_due_dates: string[];
    }>
  > {
    const params: Record<string, unknown> = { branch_id: branchId };
    if (feeType) {
      params['fee_type'] = feeType;
    }
    return this.api.get('/communications/notification-campaigns/fees-due-notify-meta', params);
  }

  markedAttendance(branchId: string | number, date: string): Observable<ApiResponse<{ grade: string; section: string; class_name: string; student_count: number }[]>> {
    return this.api.get('/communications/notification-campaigns/marked-attendance', { branch_id: branchId, date });
  }

  eligibleTargets(
    module: string,
    branchId: string | number,
    date?: string,
    options?: {
      exam_id?: string | number;
      notify_mode?: ExamNotifyMode;
      fee_notify_mode?: FeeNotifyMode;
      fee_type?: string;
      fee_structure_id?: string;
    }
  ): Observable<EligibleTargetsResponse> {
    const params: Record<string, unknown> = {
      module,
      branch_id: branchId
    };
    if (date) {
      params['date'] = date;
    }
    if (options?.exam_id) {
      params['exam_id'] = options.exam_id;
    }
    if (options?.notify_mode) {
      params['notify_mode'] = options.notify_mode;
    }
    if (options?.fee_notify_mode) {
      params['fee_notify_mode'] = options.fee_notify_mode;
    }
    if (options?.fee_type) {
      params['fee_type'] = options.fee_type;
    }
    if (options?.fee_structure_id) {
      params['fee_structure_id'] = options.fee_structure_id;
    }
    return this.api.get<EligibleTargetRow[]>('/communications/notification-campaigns/eligible-targets', params) as Observable<EligibleTargetsResponse>;
  }

  staffRecipientOptions(branchId: string | number): Observable<
    ApiResponse<{
      groups: {
        key: string;
        label: string;
        people: { user_id: number; name: string; subtitle: string }[];
      }[];
    }>
  > {
    return this.api.get('/communications/notification-campaigns/staff-recipient-options', {
      branch_id: branchId
    });
  }

  preview(payload: Record<string, unknown>): Observable<ApiResponse<CampaignSample[]>> {
    return this.api.post('/communications/notification-campaigns/preview', payload);
  }

  create(payload: Record<string, unknown>): Observable<ApiResponse<{ id: number; status?: string }>> {
    return this.api.post('/communications/notification-campaigns', payload);
  }

  progress(id: number | string): Observable<ApiResponse<{
    status: string;
    recipient_count: number;
    expected_recipient_count: number;
    materialized_count: number;
    sent_count: number;
    failed_count: number;
    pending_count: number;
    processing_count: number;
  }>> {
    return this.api.get(`/communications/notification-campaigns/${id}/progress`);
  }

  recipients(
    id: number | string,
    params: { page?: number; per_page?: number; delivery_status?: string }
  ): Observable<ApiResponse<any[]>> {
    return this.api.get(`/communications/notification-campaigns/${id}/recipients`, params);
  }

  retryFailed(id: number | string): Observable<ApiResponse<unknown>> {
    return this.api.post(`/communications/notification-campaigns/${id}/retry-failed`, {});
  }

  like(notificationId: number | string): Observable<ApiResponse<{ liked: boolean }>> {
    return this.api.post(`/communications/notification-campaigns/notifications/${notificationId}/like`, {});
  }
}
