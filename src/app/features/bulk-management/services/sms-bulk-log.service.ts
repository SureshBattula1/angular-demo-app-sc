import { Injectable } from '@angular/core';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

export interface SmsBulkQueueRow {
  id: number;
  branch_id: number;
  user_id: number | null;
  template_id: number | null;
  audience: string | null;
  body_template: string;
  sample_rendered: string | null;
  sample_label: string | null;
  recipient_count: number;
  job_count: number;
  provider: string;
  status: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  recipients_sent?: number;
  recipients_failed?: number;
  recipients_skipped?: number;
  recipients_pending?: number;
  branch_name?: string | null;
  academic_year_name?: string | null;
}

export interface SmsBulkRecipientRow {
  id: number;
  sms_bulk_queue_id: number;
  branch_id: number;
  recipient_type: string;
  recipient_id: number;
  recipient_name: string | null;
  status: string;
  error_message: string | null;
  provider_meta: Record<string, unknown> | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaravelPaginator<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface SmsBulkLogDetailData {
  queue: SmsBulkQueueRow;
  recipients: LaravelPaginator<SmsBulkRecipientRow>;
}

/** Laravel paginator JSON uses `data` for rows; tolerate `items` if the API changes. */
export function extractLaravelPaginatorData<T>(
  paginator: LaravelPaginator<T> | Record<string, unknown> | null | undefined
): { rows: T[]; total: number } {
  if (paginator == null) {
    return { rows: [], total: 0 };
  }
  const p = paginator as Record<string, unknown>;
  const raw = Array.isArray(p['data'])
    ? p['data']
    : Array.isArray(p['items'])
      ? p['items']
      : [];
  const total = typeof p['total'] === 'number' ? p['total'] : Number(p['total']) || 0;
  return { rows: raw as T[], total };
}

@Injectable({ providedIn: 'root' })
export class SmsBulkLogService {
  constructor(private api: ApiService) {}

  /**
   * Delivery log for accessible branches. Omit branchId (or null) for all branches (SuperAdmin / cross-branch).
   * Academic year: sent via X-Academic-Year-Id (interceptor) and optional query for clarity.
   */
  listLogs(
    branchId: string | number | null | undefined,
    page = 1,
    perPage = 15,
    filters?: {
      search?: string;
      batch_status?: string;
      provider?: string;
      sort_by?: string;
      sort_direction?: 'asc' | 'desc';
    },
    academicYearId?: string | number | null
  ): Observable<ApiResponse<LaravelPaginator<SmsBulkQueueRow>>> {
    const params: Record<string, unknown> = { page, per_page: perPage };
    if (branchId !== null && branchId !== undefined) {
      params['branch_id'] = branchId;
    }
    if (academicYearId != null) {
      params['academic_year_id'] = academicYearId;
    }
    if (filters?.search != null && String(filters.search).trim() !== '') {
      params['search'] = String(filters.search).trim();
    }
    if (filters?.batch_status != null && String(filters.batch_status).trim() !== '') {
      params['batch_status'] = String(filters.batch_status).trim();
    }
    if (filters?.provider != null && String(filters.provider).trim() !== '') {
      params['provider'] = String(filters.provider).trim();
    }
    if (filters?.sort_by != null && String(filters.sort_by).trim() !== '') {
      params['sort_by'] = String(filters.sort_by).trim();
    }
    if (filters?.sort_direction != null) {
      params['sort_direction'] = filters.sort_direction;
    }
    return this.api.get<LaravelPaginator<SmsBulkQueueRow>>('/branches/sms-bulk-logs', params);
  }

  getDetail(
    branchId: string | number,
    queueId: number,
    page = 1,
    perPage = 50,
    status?: string
  ): Observable<ApiResponse<SmsBulkLogDetailData>> {
    const params: Record<string, unknown> = { page, per_page: perPage };
    if (status) {
      params['status'] = status;
    }
    return this.api.get<SmsBulkLogDetailData>(
      `/branches/${branchId}/sms-bulk-logs/${queueId}`,
      params
    );
  }

  resend(
    branchId: string | number,
    queueId: number,
    items?: { recipient_type: string; recipient_id: number }[]
  ): Observable<ApiResponse<{ recipient_count: number; chunks_dispatched: number }>> {
    const body = items && items.length ? { items } : {};
    return this.api.post(`/branches/${branchId}/sms-bulk-logs/${queueId}/resend`, body);
  }
}
