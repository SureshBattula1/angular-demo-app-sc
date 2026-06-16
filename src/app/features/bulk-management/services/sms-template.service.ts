import { Injectable } from '@angular/core';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

export type SmsTemplateAudience = 'student' | 'teacher' | 'both';

export type SmsBulkAudience = 'global' | 'teachers' | 'students';

export interface SmsTemplate {
  id: number;
  branch_id: number;
  name: string;
  body: string;
  audience: SmsTemplateAudience;
  is_active: boolean;
  /** Present on aggregated list API (`/branches/sms-templates`). */
  branch_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SmsTemplatesIndexData {
  templates: SmsTemplate[];
  allowed_tags: string[];
}

export interface SmsPreviewData {
  rendered_body: string;
  context: Record<string, string>;
}

export interface SmsBulkSendData {
  recipient_count: number;
  job_count: number;
  provider: string;
  queue_id?: number;
}

export interface SmsBulkPreviewData {
  body_template: string;
  sample_rendered: string;
  sample_label: string | null;
  recipient_count: number;
  template_id: number | null;
}

export interface SmsRecipientTeacherOption {
  id: number;
  name: string;
  employee_id: string;
}

export interface SmsRecipientSectionRow {
  section: string;
  student_count: number;
}

export interface SmsRecipientGradeRow {
  grade: string;
  label: string;
  student_count: number;
  sections: SmsRecipientSectionRow[];
}

export interface SmsRecipientOptionsData {
  teachers: SmsRecipientTeacherOption[];
  grades: SmsRecipientGradeRow[];
  meta: {
    total_students: number;
    total_teachers: number;
  };
}

/** Student row from SMS typeahead search */
export interface SmsStudentSearchItem {
  id: number;
  name: string;
  grade: string;
  section: string | null;
  admission_number: string;
}

@Injectable({ providedIn: 'root' })
export class SmsTemplateService {
  constructor(private api: ApiService) {}

  list(branchId: string | number): Observable<ApiResponse<SmsTemplatesIndexData>> {
    return this.api.get<SmsTemplatesIndexData>(`/branches/${branchId}/sms-templates`);
  }

  /** All templates for accessible branches in one request (replaces N× per-branch list calls). */
  listAll(params?: { branch_id?: number }): Observable<ApiResponse<SmsTemplatesIndexData>> {
    return this.api.get<SmsTemplatesIndexData>('/branches/sms-templates', params);
  }

  recipientOptions(
    branchId: string | number,
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Observable<ApiResponse<SmsRecipientOptionsData>> {
    const seg = channel === 'whatsapp' ? 'whatsapp' : 'sms';
    return this.api.get<SmsRecipientOptionsData>(`/branches/${branchId}/${seg}-recipient-options`);
  }

  searchStudents(
    branchId: string | number,
    q: string,
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Observable<ApiResponse<{ students: SmsStudentSearchItem[] }>> {
    const seg = channel === 'whatsapp' ? 'whatsapp' : 'sms';
    return this.api.get<{ students: SmsStudentSearchItem[] }>(
      `/branches/${branchId}/${seg}-student-search`,
      { q }
    );
  }

  create(
    branchId: string | number,
    payload: {
      name: string;
      body: string;
      audience: SmsTemplateAudience;
      is_active?: boolean;
    }
  ): Observable<ApiResponse<{ template: SmsTemplate }>> {
    return this.api.post(`/branches/${branchId}/sms-templates`, payload);
  }

  update(
    branchId: string | number,
    templateId: number,
    payload: Partial<{
      name: string;
      body: string;
      audience: SmsTemplateAudience;
      is_active: boolean;
    }>
  ): Observable<ApiResponse<{ template: SmsTemplate }>> {
    return this.api.put(`/branches/${branchId}/sms-templates/${templateId}`, payload);
  }

  delete(branchId: string | number, templateId: number): Observable<ApiResponse<void>> {
    return this.api.delete(`/branches/${branchId}/sms-templates/${templateId}`);
  }

  preview(
    branchId: string | number,
    payload: {
      body?: string;
      template_id?: number;
      recipient_type: 'student' | 'teacher';
      student_id?: number;
      teacher_id?: number;
    }
  ): Observable<ApiResponse<SmsPreviewData>> {
    return this.api.post<SmsPreviewData>(`/branches/${branchId}/sms-templates/preview`, payload);
  }

  bulkSend(
    branchId: string | number,
    payload:
      | {
          audience: SmsBulkAudience;
          template_id?: number;
          body?: string;
          teacher_mode?: 'all' | 'selected';
          teacher_ids?: number[];
          student_mode?: 'all' | 'filtered' | 'selected';
          student_filters?: { grade: string; section: string | null }[];
          student_ids?: number[];
        }
      | {
          recipient_type: 'students' | 'teachers';
          template_id?: number;
          body?: string;
          recipient_ids?: number[];
          group_id?: number;
        },
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Observable<ApiResponse<SmsBulkSendData>> {
    const seg = channel === 'whatsapp' ? 'whatsapp' : 'sms';
    return this.api.post<SmsBulkSendData>(`/branches/${branchId}/${seg}-bulk-send`, payload);
  }

  /** Same body as bulk send — returns message + one sample render (no queue, no DB write). */
  previewBulkSend(
    branchId: string | number,
    payload: Parameters<SmsTemplateService['bulkSend']>[1],
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Observable<ApiResponse<SmsBulkPreviewData>> {
    const seg = channel === 'whatsapp' ? 'whatsapp' : 'sms';
    return this.api.post<SmsBulkPreviewData>(
      `/branches/${branchId}/${seg}-bulk-send/preview`,
      payload
    );
  }
}
