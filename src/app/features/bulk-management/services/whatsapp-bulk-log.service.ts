import { Injectable } from '@angular/core';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Observable } from 'rxjs';
import {
  LaravelPaginator,
  SmsBulkLogDetailData,
  SmsBulkQueueRow
} from './sms-bulk-log.service';

export type { SmsBulkQueueRow, SmsBulkRecipientRow, SmsBulkLogDetailData } from './sms-bulk-log.service';

@Injectable({ providedIn: 'root' })
export class WhatsAppBulkLogService {
  constructor(private api: ApiService) {}

  listLogs(
    branchId: number | null | undefined,
    page = 1,
    perPage = 15,
    filters?: {
      search?: string;
      batch_status?: string;
      provider?: string;
      sort_by?: string;
      sort_direction?: 'asc' | 'desc';
    },
    academicYearId?: number | null
  ): Observable<ApiResponse<LaravelPaginator<SmsBulkQueueRow>>> {
    const params: Record<string, unknown> = { page, per_page: perPage };
    if (branchId !== null && branchId !== undefined) {
      params['branch_id'] = Number(branchId);
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
    return this.api.get<LaravelPaginator<SmsBulkQueueRow>>('/branches/whatsapp-bulk-logs', params);
  }

  getDetail(
    branchId: number,
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
      `/branches/${branchId}/whatsapp-bulk-logs/${queueId}`,
      params
    );
  }

  resend(
    branchId: number,
    queueId: number,
    items?: { recipient_type: string; recipient_id: number }[]
  ): Observable<ApiResponse<{ recipient_count: number; chunks_dispatched: number }>> {
    const body = items && items.length ? { items } : {};
    return this.api.post(`/branches/${branchId}/whatsapp-bulk-logs/${queueId}/resend`, body);
  }
}
