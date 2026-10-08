import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { NotificationCampaignService } from '../../services/notification-campaign.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { formatApiDateTimeLocal } from '../../../../shared/utils/api-datetime.util';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';
import { AdvancedSearchSidebarComponent } from '../../../../shared/components/advanced-search-sidebar/advanced-search-sidebar.component';
import { AdvancedSearchConfig, SearchCriteria, SearchOption } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import {
  BRANCH_TEAM_SECTION_LABELS,
  createCampaignRecipientAdvancedSearchConfig
} from '../../config/campaign-search.config';

@Component({
  selector: 'app-campaign-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, AdvancedSearchSidebarComponent],
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
  recipientAdvancedOpen = false;
  recipientAdvancedCriteria: SearchCriteria = {};
  recipientTotal = 0;
  recipientPage = 1;
  recipientPageSize = 25;

  recipientAdvancedSearchConfig: AdvancedSearchConfig = createCampaignRecipientAdvancedSearchConfig();

  private recipientSectionsByGrade: Record<string, SearchOption[]> = {};
  private recipientSearchDebounce?: ReturnType<typeof setTimeout>;
  private pollSub?: Subscription;
  private campaignId = '';

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
    if (this.recipientSearchDebounce) {
      clearTimeout(this.recipientSearchDebounce);
    }
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
    if (key === 'staff') {
      return 'Team';
    }
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
    if (String(row.grade ?? '') === 'Staff') {
      const roleLabel = BRANCH_TEAM_SECTION_LABELS[String(row.section ?? '')] || 'Branch team';
      return `Branch team · ${roleLabel}`;
    }
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
    this.recipientSearch = (value || '').replace(/^\s+/, '').replace(/\s+/g, ' ');
    if (this.recipientSearchDebounce) {
      clearTimeout(this.recipientSearchDebounce);
    }
    this.recipientSearchDebounce = setTimeout(() => this.loadRecipients(1), 350);
  }

  openRecipientAdvancedSearch(): void {
    this.recipientAdvancedOpen = true;
  }

  closeRecipientAdvancedSearch(): void {
    this.recipientAdvancedOpen = false;
  }

  onRecipientAdvancedSearch(criteria: SearchCriteria): void {
    this.recipientAdvancedCriteria = { ...criteria };
    this.loadRecipients(1);
  }

  onRecipientAdvancedReset(): void {
    this.recipientAdvancedCriteria = {};
    this.loadRecipients(1);
  }

  onRecipientAdvancedFieldChange(event: { field: string; value: unknown }): void {
    if (event.field !== 'grade') {
      return;
    }
    const grade = String(event.value ?? '').trim();
    this.patchRecipientSearchFieldOptions(undefined, grade);
  }

  private patchRecipientSearchFieldOptions(
    gradeOptions?: SearchOption[],
    activeGrade?: string
  ): void {
    const gradeField = this.recipientAdvancedSearchConfig.fields.find(f => f.key === 'grade');
    const sectionField = this.recipientAdvancedSearchConfig.fields.find(f => f.key === 'section');
    if (gradeOptions && gradeField) {
      gradeField.options = gradeOptions;
    }
    if (sectionField) {
      const grade = activeGrade ?? String(this.recipientAdvancedCriteria['grade'] ?? '').trim();
      sectionField.options = grade ? [...(this.recipientSectionsByGrade[grade] || [])] : [];
    }
  }

  resetRecipientFilters(): void {
    this.recipientSearch = '';
    this.recipientAdvancedCriteria = {};
    this.loadRecipients(1);
  }

  recipientActiveFilterCount(): number {
    let count = Object.keys(this.recipientAdvancedCriteria).filter(key => {
      const value = this.recipientAdvancedCriteria[key];
      return value !== null && value !== undefined && value !== '';
    }).length;
    if (this.recipientSearch.trim()) {
      count += 1;
    }
    return count;
  }

  hasRecipientFilters(): boolean {
    return this.recipientActiveFilterCount() > 0;
  }

  filteredRecipientCountLabel(): string {
    const campaignTotal = this.campaign?.recipient_count ?? 0;
    if (this.hasRecipientFilters() && this.recipientTotal !== campaignTotal) {
      return `${this.recipientTotal} matching · ${campaignTotal} in campaign`;
    }
    return `${this.recipientTotal} total`;
  }

  private loadCampaign(): void {
    this.campaigns.show(this.campaignId).subscribe({
      next: response => {
        this.campaign = response.data;
        this.buildRecipientFilterOptions();
        this.loading = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  private buildRecipientFilterOptions(): void {
    const targets = this.campaign?.targets ?? [];
    const gradeMap = new Map<string, string>();
    this.recipientSectionsByGrade = {};

    for (const target of targets) {
      const grade = String(target.grade ?? '').trim();
      if (!grade) {
        continue;
      }
      const gradeLabel = target.class_name || `Grade ${grade}`;
      if (!gradeMap.has(grade)) {
        gradeMap.set(grade, gradeLabel);
      }
      const section = String(target.section ?? '').trim();
      if (!section) {
        continue;
      }
      if (!this.recipientSectionsByGrade[grade]) {
        this.recipientSectionsByGrade[grade] = [];
      }
      if (!this.recipientSectionsByGrade[grade].some(opt => opt.value === section)) {
        this.recipientSectionsByGrade[grade].push({
          value: section,
          label: `Section ${section}`
        });
      }
    }

    const gradeOptions: SearchOption[] = Array.from(gradeMap.entries()).map(([value, label]) => ({
      value,
      label
    }));

    this.patchRecipientSearchFieldOptions(gradeOptions);
  }

  private recipientQueryParams(page: number): {
    page: number;
    per_page: number;
    q?: string;
    delivery_status?: string;
    grade?: string;
    section?: string;
    status_key?: string;
    viewed?: string;
    liked?: string;
    audience?: string;
    team_role?: string;
  } {
    const params: {
      page: number;
      per_page: number;
      q?: string;
      delivery_status?: string;
      grade?: string;
      section?: string;
      status_key?: string;
      viewed?: string;
      liked?: string;
      audience?: string;
      team_role?: string;
    } = {
      page,
      per_page: this.recipientPageSize
    };
    const q = this.recipientSearch.trim();
    if (q) {
      params.q = q;
    }
    const c = this.recipientAdvancedCriteria;
    if (c['delivery_status']) {
      params.delivery_status = String(c['delivery_status']);
    }
    if (c['grade']) {
      params.grade = String(c['grade']);
    }
    if (c['section']) {
      params.section = String(c['section']);
    }
    if (c['status_key']) {
      params.status_key = String(c['status_key']).trim();
    }
    if (c['viewed'] !== undefined && c['viewed'] !== null && c['viewed'] !== '') {
      params.viewed = String(c['viewed']);
    }
    if (c['liked'] !== undefined && c['liked'] !== null && c['liked'] !== '') {
      params.liked = String(c['liked']);
    }
    if (c['audience']) {
      params.audience = String(c['audience']);
    }
    if (c['team_role']) {
      params.team_role = String(c['team_role']);
    }
    return params;
  }

  private loadRecipients(page: number): void {
    this.recipientsLoading = true;
    this.campaigns.recipients(this.campaignId, this.recipientQueryParams(page)).subscribe({
      next: response => {
        const rows = response.data || [];
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
