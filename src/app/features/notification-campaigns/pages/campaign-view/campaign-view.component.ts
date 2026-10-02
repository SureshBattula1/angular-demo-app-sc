import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { NotificationCampaignService } from '../../services/notification-campaign.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { formatApiDateTimeLocal } from '../../../../shared/utils/api-datetime.util';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';

@Component({
  selector: 'app-campaign-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './campaign-view.component.html',
  styleUrls: ['./campaign-view.component.scss']
})
export class CampaignViewComponent implements OnInit, OnDestroy {
  loading = true;
  campaign: any = null;
  progress: any = null;
  recipientsLoading = false;

  recipientColumns = ['student', 'class', 'status', 'delivery', 'viewed', 'liked'];
  recipientDataSource = new MatTableDataSource<any>([]);
  recipientSearch = '';
  recipientTotal = 0;
  recipientPage = 1;
  recipientPageSize = 25;

  private pollSub?: Subscription;
  private campaignId = '';

  @ViewChild('recipientPaginator')
  set recipientPaginatorRef(paginator: MatPaginator | undefined) {
    if (!paginator) {
      return;
    }
    this.recipientDataSource.paginator = paginator;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaigns: NotificationCampaignService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/notification-campaigns']);
      return;
    }
    this.campaignId = id;
    this.loadCampaign();
    this.loadRecipients(1);
    this.startProgressPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  formatScheduledAt(value: string | null | undefined): string {
    return formatApiDateTimeLocal(value);
  }

  back(): void {
    this.router.navigate(['/notification-campaigns'], {
      queryParams: { tab: this.campaign?.module || 'attendance' }
    });
  }

  retryFailed(): void {
    this.campaigns.retryFailed(this.campaignId).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Retry queued');
        this.loadCampaign();
        this.startProgressPolling();
      },
      error: error => this.errorHandler.showError(error)
    });
  }

  onRecipientPage(event: PageEvent): void {
    this.recipientPage = event.pageIndex + 1;
    this.recipientPageSize = event.pageSize;
    this.loadRecipients(this.recipientPage);
  }

  moduleIcon(module: string): string {
    const icons: Record<string, string> = {
      attendance: 'fact_check',
      exams: 'assignment',
      fees: 'payments',
      holidays: 'event',
      assignments: 'assignment_turned_in',
      custom: 'edit_note'
    };
    return icons[module] || 'campaign';
  }

  moduleLabel(module: string): string {
    return (module || 'notification').replace(/^\w/, c => c.toUpperCase());
  }

  campaignStatusClass(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'status-sent';
    if (value === 'failed') return 'status-failed';
    if (value === 'partial') return 'status-partial';
    if (value === 'materializing' || value === 'queued' || value === 'sending') return 'status-pending';
    return 'status-pending';
  }

  campaignStatusLabel(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'Sent';
    if (value === 'failed') return 'Failed';
    if (value === 'partial') return 'Partial';
    if (value === 'materializing') return 'Preparing recipients';
    if (value === 'queued') return 'Queued';
    if (value === 'sending') return 'Sending';
    return 'Pending';
  }

  isInProgress(): boolean {
    const status = (this.progress?.status || this.campaign?.status || '').toLowerCase();
    return ['materializing', 'queued', 'sending', 'pending'].includes(status);
  }

  progressPercent(): number {
    const total = this.progress?.recipient_count || this.campaign?.recipient_count || 0;
    const sent = this.progress?.sent_count ?? this.campaign?.sent_count ?? 0;
    if (!total) {
      const expected = this.progress?.expected_recipient_count || this.campaign?.expected_recipient_count || 0;
      if (expected && this.progress?.materialized_count != null) {
        return Math.min(100, Math.round((this.progress.materialized_count / expected) * 100));
      }
      return 0;
    }
    return Math.min(100, Math.round((sent / total) * 100));
  }

  deliveryStatusClass(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'badge-success';
    if (value === 'failed') return 'badge-danger';
    if (value === 'processing') return 'badge-warning';
    return 'badge-warning';
  }

  statusKeyLabel(key: string): string {
    if (!key) return '—';
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  statusKeyClass(key: string): string {
    const value = (key || '').toLowerCase();
    if (value === 'present') return 'status-present';
    if (value === 'absent') return 'status-absent';
    if (value === 'leave') return 'status-leave';
    if (value === 'overdue') return 'status-absent';
    if (value === 'due') return 'status-leave';
    if (value === 'scheduled') return 'status-neutral';
    if (value === 'result') return 'status-present';
    return 'status-neutral';
  }

  targetClassLabel(target: { class_name?: string; grade?: string; section?: string }): string {
    const name = target.class_name || (target.grade ? `Grade ${target.grade}` : '');
    return `${name}${target.section ? ` · Section ${target.section}` : ''}`.trim();
  }

  recipientClassName(row: { class_name?: string; grade?: string }): string {
    return row.class_name || (row.grade ? `Grade ${row.grade}` : '—');
  }

  recipientSection(row: { section?: string }): string {
    return row.section ? `Section ${row.section}` : '—';
  }

  recipientClassLine(row: { class_name?: string; grade?: string; section?: string }): string {
    const name = this.recipientClassName(row);
    const section = row.section ? `Section ${row.section}` : '';
    if (name === '—' && !section) {
      return '—';
    }
    return [name, section].filter(Boolean).join(' · ');
  }

  studentInitial(name: string): string {
    const trimmed = (name || '').trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
  }

  statRate(part: number, total: number): number {
    if (!total || total <= 0) {
      return 0;
    }
    return Math.round((part / total) * 100);
  }

  applyRecipientFilter(value: string): void {
    this.recipientSearch = (value || '').trim().toLowerCase();
    this.loadRecipients(1);
  }

  filteredRecipientCount(): number {
    return this.recipientTotal;
  }

  private loadCampaign(): void {
    this.campaigns.show(this.campaignId).subscribe({
      next: response => {
        this.campaign = response.data;
        this.loading = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  private loadRecipients(page: number): void {
    this.recipientsLoading = true;
    this.campaigns.recipients(this.campaignId, {
      page,
      per_page: this.recipientPageSize
    }).subscribe({
      next: response => {
        let rows = response.data || [];
        if (this.recipientSearch) {
          rows = rows.filter(row => {
            const haystack = [
              row.student_name,
              row.class_name,
              row.section,
              row.status_key,
              row.delivery_status
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return haystack.includes(this.recipientSearch);
          });
        }
        this.recipientDataSource.data = rows;
        this.recipientTotal = response.meta?.total ?? rows.length;
        this.recipientPage = response.meta?.current_page ?? page;
        this.recipientsLoading = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.recipientsLoading = false;
      }
    });
  }

  private startProgressPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(4000)
      .pipe(
        switchMap(() => this.campaigns.progress(this.campaignId)),
        takeWhile(response => {
          const status = (response.data?.status || '').toLowerCase();
          this.progress = response.data;
          if (this.campaign && response.data) {
            this.campaign.sent_count = response.data.sent_count;
            this.campaign.failed_count = response.data.failed_count;
            this.campaign.recipient_count = response.data.recipient_count;
            this.campaign.status = response.data.status;
          }
          if (!['materializing', 'queued', 'sending', 'pending'].includes(status)) {
            this.loadRecipients(this.recipientPage);
            this.loadCampaign();
            return false;
          }
          return true;
        }, true)
      )
      .subscribe();
  }
}
