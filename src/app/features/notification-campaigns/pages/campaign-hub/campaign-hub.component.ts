import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { PaginationEvent, SearchEvent, TableConfig } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import {
  CampaignDashboardPayload,
  CampaignListRow,
  CampaignModuleDashboardStats,
  NotificationCampaignService
} from '../../services/notification-campaign.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { DoughnutChartComponent, DoughnutChartData } from '../../../../shared/components/charts/doughnut-chart/doughnut-chart.component';
import { BarChartComponent, BarChartData } from '../../../../shared/components/charts/bar-chart/bar-chart.component';
import { LineChartComponent, LineChartData } from '../../../../shared/components/charts/line-chart/line-chart.component';

type HubTab = 'dashboard' | string;
type DashboardPeriod = 'today' | 'week' | 'month' | 'custom' | 'all';

const MODULE_ICONS: Record<string, string> = {
  attendance: 'fact_check',
  exams: 'assignment',
  fees: 'payments',
  holidays: 'event',
  assignments: 'assignment_turned_in',
  custom: 'edit_note'
};

const THEME_CHART = {
  primary: '#00897b',
  accent: '#4caf50',
  info: '#2196f3',
  warning: '#ff9800',
  error: '#f44336'
};

const EMPTY_MODULE_STATS: CampaignModuleDashboardStats = {
  campaigns: 0,
  pending: 0,
  sent: 0,
  failed: 0,
  recipients: 0
};

@Component({
  selector: 'app-campaign-hub',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    DataTableComponent,
    DoughnutChartComponent,
    BarChartComponent,
    LineChartComponent
  ],
  templateUrl: './campaign-hub.component.html',
  styleUrls: ['./campaign-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignHubComponent implements OnInit {
  tabs: { id: HubTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'attendance', label: 'Attendance', icon: 'fact_check' },
    { id: 'exams', label: 'Exams', icon: 'assignment' },
    { id: 'fees', label: 'Fees', icon: 'payments' },
    { id: 'holidays', label: 'Holidays', icon: 'event' },
    { id: 'assignments', label: 'Assignments', icon: 'assignment_turned_in' }
  ];

  activeTab: HubTab = 'dashboard';
  /** List tab spinner (data-table). */
  loading = false;
  /** Core KPI/module query in flight. */
  dashboardCoreLoading = false;
  /** Recent + activity query in flight. */
  dashboardExtrasLoading = false;
  rows: CampaignListRow[] = [];
  dashboardPayload: CampaignDashboardPayload | null = null;
  private dashboardRequestSeq = 0;
  /** Stable chart inputs (never bind template methods — avoids Chart.js infinite updates). */
  showCharts = false;
  cachedTotals: CampaignDashboardPayload['totals'] = {
    campaigns: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    recipients: 0
  };
  deliveryRatePercent = 0;
  failedModuleKey: string | null = null;
  moduleCards: { key: string; label: string; icon: string; stats: CampaignModuleDashboardStats; theme: string }[] = [];
  recentRows: CampaignDashboardPayload['recent'] = [];
  statusChart: DoughnutChartData | null = null;
  moduleBarChart: BarChartData | null = null;
  activityLineChart: LineChartData | null = null;
  selectedBranchLabel = 'All branches';

  dashboardBranchId = 'all';
  branches: { id: string | number; name: string }[] = [];
  selectedPeriod = new FormControl<DashboardPeriod>('all');
  customFromDate = new FormControl<Date | null>(null);
  customToDate = new FormControl<Date | null>(null);

  @ViewChild(DataTableComponent) private dataTable?: DataTableComponent;

  tableConfig: TableConfig = {
    columns: [
      { key: 'branch', header: 'Branch', sortable: false },
      {
        key: 'class_display',
        header: 'Class',
        sortable: false,
        width: '220px',
        cellClass: () => 'cell-nowrap'
      },
      { key: 'event_date', header: 'Date', sortable: false, width: '130px' },
      { key: 'scheduled_at', header: 'Scheduled', sortable: false, width: '180px', pipe: 'datetime' },
      { key: 'student_count', header: 'Students', sortable: false, width: '110px', align: 'center' },
      {
        key: 'status',
        header: 'Status',
        type: 'badge',
        width: '120px',
        align: 'center',
        cellClass: (row: CampaignListRow) => this.statusClass(this.rowDisplayStatus(row))
      }
    ],
    actions: [{ icon: 'visibility', label: 'View', action: (row: CampaignListRow) => this.view(row) }],
    pagination: true,
    searchable: true,
    advancedSearch: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50],
    defaultPageSize: 25,
    showAddButton: true,
    primaryButtonLabel: 'Schedule notification',
    primaryButtonIcon: 'schedule_send'
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Notification Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        placeholder: 'Select branch',
        icon: 'business',
        options: []
      },
      {
        key: 'grade',
        label: 'Class',
        type: 'select',
        placeholder: 'Select class',
        icon: 'school',
        options: []
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        placeholder: 'Select section',
        icon: 'class',
        options: [],
        dependsOn: 'grade'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'sent', label: 'Sent' }
        ]
      }
    ]
  };

  private page = 1;
  private perPage = 25;
  private filters: Record<string, string> = {};
  private selectedBranchId: string | number | null = null;

  constructor(
    private campaigns: NotificationCampaignService,
    private errorHandler: ErrorHandlerService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam) {
      this.activeTab = tabParam;
    } else {
      this.activeTab = 'dashboard';
    }
    if (this.activeTab === 'custom') {
      this.router.navigate(['/notification-campaigns/schedule', 'custom']);
      return;
    }

    this.dashboardPayload = this.emptyDashboardPayload();
    this.refreshDashboardView();
    this.loadBranches();
    // Fetch dashboard/list immediately — do not wait for modules metadata.
    this.load();

    this.campaigns.modules().subscribe({
      next: response => {
        const meta = response.meta || {};
        const moduleTabs = Object.keys(response.data || {})
          .filter(slug => slug !== 'teacher_attendance')
          .map(slug => ({
            id: slug,
            label: meta[slug]?.label || slug.charAt(0).toUpperCase() + slug.slice(1),
            icon: MODULE_ICONS[slug] || 'campaign'
          }));
        this.tabs = [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' }, ...moduleTabs];
        if (!this.tabs.some(item => item.id === this.activeTab)) {
          this.activeTab = 'dashboard';
          this.load();
        } else {
          this.refreshDashboardView();
        }
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorHandler.showError(error);
      }
    });
  }

  switchTab(tab: string): void {
    if (!this.tabs.some(item => item.id === tab)) {
      return;
    }
    if (tab === 'custom') {
      this.router.navigate(['/notification-campaigns/schedule', 'custom']);
      return;
    }
    this.activeTab = tab as HubTab;
    this.page = 1;
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
    this.cdr.markForCheck();
    this.load();
  }

  onDashboardBranchChange(): void {
    if (this.activeTab === 'dashboard') {
      this.loadDashboard();
    }
  }

  onPeriodChange(): void {
    if (this.selectedPeriod.value !== 'custom') {
      this.customFromDate.setValue(null);
      this.customToDate.setValue(null);
      if (this.activeTab === 'dashboard') {
        this.loadDashboard();
      }
    }
  }

  onCustomRangeChange(): void {
    if (this.selectedPeriod.value === 'custom' && this.customFromDate.value && this.customToDate.value) {
      this.load();
    }
  }

  onAdvancedSearch(event: SearchEvent): void {
    const next: Record<string, string> = {};
    Object.entries(event.filters || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        next[key] = String(value);
      }
    });
    if (event.query && event.query.trim()) {
      next['search'] = event.query.trim();
    }
    this.filters = next;
    this.page = 1;
    this.load();
  }

  onSearchReset(): void {
    this.filters = {};
    this.selectedBranchId = null;
    this.setGradeOptions([]);
    this.setSectionOptions([]);
    this.page = 1;
    this.load();
  }

  onSearchFieldChanged(event: { field: string; value: unknown }): void {
    if (event.field === 'branch_id') {
      this.selectedBranchId = event.value ? String(event.value) : null;
      this.setSectionOptions([]);
      if (this.selectedBranchId) {
        this.loadGrades(this.selectedBranchId);
      } else {
        this.setGradeOptions([]);
      }
    }

    if (event.field === 'grade') {
      const grade = event.value ? String(event.value) : '';
      if (this.selectedBranchId && grade) {
        this.loadSections(this.selectedBranchId, grade);
      } else {
        this.setSectionOptions([]);
      }
    }
  }

  load(): void {
    if (this.activeTab === 'dashboard') {
      this.loadDashboard();
      return;
    }

    this.loading = true;
    this.campaigns
      .list({
        module: this.activeTab,
        page: this.page,
        per_page: this.perPage,
        ...this.filters
      })
      .subscribe({
        next: response => {
          const total = response.meta?.total || 0;
          this.rows = (response.data || []).map(row => ({
            ...row,
            class_display: this.classSectionLabel(row),
            status: this.statusLabel(this.rowDisplayStatus(row))
          }));
        this.tableConfig = { ...this.tableConfig, totalCount: total };
        this.loading = false;
        this.cdr.markForCheck();
        queueMicrotask(() => this.dataTable?.updateServerData(this.rows, total));
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onAction(event: { action: string; row: CampaignListRow | null }): void {
    if (event.action === 'add' && this.activeTab !== 'dashboard') {
      this.router.navigate(['/notification-campaigns/schedule', this.activeTab]);
    }
  }

  view(row: CampaignListRow): void {
    this.router.navigate(['/notification-campaigns/view', row.id]);
  }

  viewRecent(row: { id: number }): void {
    this.router.navigate(['/notification-campaigns/view', row.id]);
  }

  scheduleModule(moduleKey: string): void {
    this.router.navigate(['/notification-campaigns/schedule', moduleKey]);
  }

  trackModuleCard(_index: number, card: { key: string }): string {
    return card.key;
  }

  onPagination(event: PaginationEvent): void {
    this.page = event.page + 1;
    this.perPage = event.pageSize;
    this.load();
  }

  moduleSentProgress(stats: CampaignModuleDashboardStats): number {
    if (stats.campaigns <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((stats.sent / stats.campaigns) * 100));
  }

  openModuleWithMostFailures(): void {
    if (this.failedModuleKey) {
      this.switchTab(this.failedModuleKey);
    }
  }

  moduleLabel(module: string): string {
    const tab = this.tabs.find(t => t.id === module);
    return tab?.label || module;
  }

  moduleIcon(module: string): string {
    return MODULE_ICONS[module] || 'campaign';
  }

  classSectionLabel(row: Pick<CampaignListRow, 'class_name' | 'grade' | 'section'>): string {
    const name = row.class_name || (row.grade ? `Grade ${row.grade}` : '');
    const section = row.section ? `Section ${row.section}` : '';
    return [name, section].filter(Boolean).join(' · ') || '—';
  }

  rowDisplayStatus(row: CampaignListRow): string {
    const campaign = (row.campaign_status || '').toLowerCase();
    if (['materializing', 'queued'].includes(campaign)) {
      return campaign;
    }
    if (campaign === 'sending' && (row.status || '').toLowerCase() === 'pending') {
      return 'sending';
    }
    return row.status || campaign || 'pending';
  }

  statusClass(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'badge-success';
    if (value === 'failed') return 'badge-danger';
    if (value === 'partial') return 'badge-warning';
    if (value === 'materializing' || value === 'queued' || value === 'sending') return 'badge-warning';
    return 'badge-warning';
  }

  statusLabel(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'Sent';
    if (value === 'failed') return 'Failed';
    if (value === 'partial') return 'Partial';
    if (value === 'materializing') return 'Preparing';
    if (value === 'queued') return 'Queued';
    if (value === 'sending') return 'Sending';
    return 'Pending';
  }

  campaignStatusLabel(status: string): string {
    return this.statusLabel(status);
  }

  private loadDashboard(): void {
    const seq = ++this.dashboardRequestSeq;
    const base = this.buildDashboardParams();
    this.dashboardCoreLoading = true;
    this.dashboardExtrasLoading = true;
    this.refreshDashboardView();

    this.campaigns
      .dashboard({ ...base, include: 'core' })
      .pipe(
        finalize(() => {
          if (seq === this.dashboardRequestSeq) {
            this.dashboardCoreLoading = false;
            this.refreshDashboardView();
          }
        })
      )
      .subscribe({
        next: response => {
          if (seq !== this.dashboardRequestSeq) {
            return;
          }
          if (response?.success === false) {
            this.dashboardPayload = this.emptyDashboardPayload();
            this.refreshDashboardView();
            return;
          }
          const core = this.normalizeDashboardPayload(response.data);
          this.dashboardPayload = {
            ...(this.dashboardPayload ?? this.emptyDashboardPayload()),
            ...core
          };
          this.refreshDashboardView();
        },
        error: error => {
          if (seq !== this.dashboardRequestSeq) {
            return;
          }
          this.errorHandler.showError(error);
          this.dashboardPayload = this.emptyDashboardPayload();
          this.refreshDashboardView();
        }
      });

    this.campaigns
      .dashboard({ ...base, include: 'extras' })
      .pipe(
        finalize(() => {
          if (seq === this.dashboardRequestSeq) {
            this.dashboardExtrasLoading = false;
            this.refreshDashboardView();
          }
        })
      )
      .subscribe({
        next: response => {
          if (seq !== this.dashboardRequestSeq || !this.dashboardPayload) {
            return;
          }
          const extras = response.data ?? {};
          this.dashboardPayload = {
            ...this.dashboardPayload,
            recent: extras.recent ?? this.dashboardPayload.recent ?? [],
            activity_by_day: extras.activity_by_day ?? this.dashboardPayload.activity_by_day ?? []
          };
          this.refreshDashboardView();
        },
        error: () => {
          if (seq !== this.dashboardRequestSeq || !this.dashboardPayload) {
            return;
          }
          this.dashboardPayload = {
            ...this.dashboardPayload,
            recent: this.dashboardPayload.recent ?? [],
            activity_by_day: this.dashboardPayload.activity_by_day ?? []
          };
          this.refreshDashboardView();
        }
      });
  }

  /** Rebuild template-bound view model once per payload change (stable chart object refs). */
  private refreshDashboardView(): void {
    const payload = this.dashboardPayload ?? this.emptyDashboardPayload();
    this.cachedTotals = { ...payload.totals };

    const denom = payload.totals.sent + payload.totals.pending + payload.totals.failed;
    this.deliveryRatePercent = denom > 0 ? Math.round((payload.totals.sent / denom) * 100) : 0;

    this.failedModuleKey = null;
    let bestFailed = 0;
    const themes = ['primary', 'success', 'info', 'warning'];
    const byModule = payload.by_module ?? {};
    this.moduleCards = this.tabs
      .filter(tab => tab.id !== 'dashboard')
      .map((tab, index) => {
        const stats = byModule[tab.id] ?? { ...EMPTY_MODULE_STATS };
        if (stats.failed > bestFailed) {
          bestFailed = stats.failed;
          this.failedModuleKey = tab.id;
        }
        return {
          key: tab.id,
          label: tab.label,
          icon: tab.icon,
          stats,
          theme: themes[index % themes.length]
        };
      });

    this.recentRows = [...(payload.recent ?? [])];

    const breakdown = payload.status_breakdown;
    const statusTotal = breakdown.sent + breakdown.pending + breakdown.failed;
    if (statusTotal <= 0) {
      this.statusChart = { labels: ['No data'], data: [1], backgroundColor: ['#e0e0e0'] };
    } else {
      this.statusChart = {
        labels: ['Sent', 'Pending', 'Failed'],
        data: [breakdown.sent, breakdown.pending, breakdown.failed],
        backgroundColor: [THEME_CHART.accent, THEME_CHART.warning, THEME_CHART.error]
      };
    }

    if (this.moduleCards.length === 0) {
      this.moduleBarChart = null;
    } else {
      this.moduleBarChart = {
        labels: this.moduleCards.map(c => c.label),
        datasets: [
          {
            label: 'Campaigns',
            data: this.moduleCards.map(c => c.stats.campaigns),
            backgroundColor: THEME_CHART.primary
          },
          {
            label: 'Recipients',
            data: this.moduleCards.map(c => c.stats.recipients),
            backgroundColor: THEME_CHART.info
          }
        ]
      };
    }

    const days = payload.activity_by_day ?? [];
    if (days.length === 0) {
      this.activityLineChart = null;
    } else {
      this.activityLineChart = {
        labels: days.map(d => this.formatShortDate(d.date)),
        datasets: [
          {
            label: 'Campaigns scheduled',
            data: days.map(d => d.campaigns),
            borderColor: THEME_CHART.primary,
            backgroundColor: 'rgba(0, 137, 123, 0.12)',
            tension: 0.35
          }
        ]
      };
    }

    if (this.dashboardBranchId === 'all') {
      this.selectedBranchLabel = 'All branches';
    } else {
      const branch = this.branches.find(b => String(b.id) === String(this.dashboardBranchId));
      this.selectedBranchLabel = branch?.name || 'Branch';
    }

    this.showCharts = !this.dashboardCoreLoading;
    this.cdr.markForCheck();
  }

  private emptyDashboardPayload(): CampaignDashboardPayload {
    const byModule: Record<string, CampaignModuleDashboardStats> = {};
    this.tabs
      .filter(tab => tab.id !== 'dashboard')
      .forEach(tab => {
        byModule[tab.id] = { ...EMPTY_MODULE_STATS };
      });
    return {
      by_module: byModule,
      totals: { campaigns: 0, pending: 0, sent: 0, failed: 0, recipients: 0 },
      status_breakdown: { sent: 0, pending: 0, failed: 0 },
      recent: [],
      activity_by_day: []
    };
  }

  private buildDashboardParams(): { branch_id?: string; from?: string; to?: string } {
    const params: { branch_id?: string; from?: string; to?: string } = {};
    if (this.dashboardBranchId && this.dashboardBranchId !== 'all') {
      params.branch_id = String(this.dashboardBranchId);
    }
    const range = this.dashboardDateRange();
    if (range.from) {
      params.from = range.from;
    }
    if (range.to) {
      params.to = range.to;
    }
    return params;
  }

  private dashboardDateRange(): { from?: string; to?: string } {
    const period = this.selectedPeriod.value ?? 'all';
    const today = new Date();
    const toIso = (d: Date) => d.toISOString().slice(0, 10);

    if (period === 'all') {
      return {};
    }
    if (period === 'today') {
      const d = toIso(today);
      return { from: d, to: d };
    }
    if (period === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { from: toIso(start), to: toIso(today) };
    }
    if (period === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toIso(start), to: toIso(today) };
    }
    if (period === 'custom' && this.customFromDate.value && this.customToDate.value) {
      return { from: toIso(this.customFromDate.value), to: toIso(this.customToDate.value) };
    }
    return {};
  }

  private formatShortDate(iso: string): string {
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  }

  private normalizeDashboardPayload(data: unknown): CampaignDashboardPayload {
    const raw = (data ?? {}) as Record<string, unknown>;
    const empty = this.emptyDashboardPayload();
    if (raw['by_module'] && typeof raw['by_module'] === 'object') {
      return {
        by_module: raw['by_module'] as Record<string, CampaignModuleDashboardStats>,
        totals: (raw['totals'] as CampaignDashboardPayload['totals']) ?? empty.totals,
        status_breakdown:
          (raw['status_breakdown'] as CampaignDashboardPayload['status_breakdown']) ?? empty.status_breakdown,
        recent: (raw['recent'] as CampaignDashboardPayload['recent']) ?? empty.recent,
        activity_by_day:
          (raw['activity_by_day'] as CampaignDashboardPayload['activity_by_day']) ?? empty.activity_by_day
      };
    }
    const byModule = raw as Record<string, CampaignModuleDashboardStats>;
    if (!raw['totals'] && !Object.keys(byModule).some(k => byModule[k]?.campaigns !== undefined)) {
      return {
        ...empty,
        recent: (raw['recent'] as CampaignDashboardPayload['recent']) ?? empty.recent,
        activity_by_day:
          (raw['activity_by_day'] as CampaignDashboardPayload['activity_by_day']) ?? empty.activity_by_day
      };
    }
    const legacyByModule = raw as Record<string, CampaignModuleDashboardStats>;
    let totals: CampaignDashboardPayload['totals'] = {
      campaigns: 0,
      pending: 0,
      sent: 0,
      failed: 0,
      recipients: 0
    };
    Object.values(legacyByModule).forEach(stats => {
      if (!stats || typeof stats !== 'object' || stats.campaigns === undefined) {
        return;
      }
      totals = {
        campaigns: totals.campaigns + (stats.campaigns || 0),
        pending: totals.pending + (stats.pending || 0),
        sent: totals.sent + (stats.sent || 0),
        failed: totals.failed + (stats.failed || 0),
        recipients: totals.recipients + (stats.recipients || 0)
      };
    });
    return {
      by_module: legacyByModule,
      totals,
      status_breakdown: {
        sent: totals.sent,
        pending: totals.pending,
        failed: totals.failed
      },
      recent: [],
      activity_by_day: []
    };
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: response => {
        this.branches = response.data || [];
        this.refreshDashboardView();
        const field = this.advancedSearchConfig.fields.find(item => item.key === 'branch_id');
        if (field) {
          field.options = this.branches.map(branch => ({
            value: String(branch.id),
            label: branch.name
          }));
        }
      }
    });
  }

  private setGradeOptions(options: { value: string; label: string; disabled?: boolean }[]): void {
    const field = this.advancedSearchConfig.fields.find(item => item.key === 'grade');
    if (field) {
      field.options = options;
    }
  }

  private setSectionOptions(options: { value: string; label: string; disabled?: boolean }[]): void {
    const field = this.advancedSearchConfig.fields.find(item => item.key === 'section');
    if (field) {
      field.options = options;
    }
  }

  private loadGrades(branchId: string | number): void {
    this.setGradeOptions([{ value: '', label: 'Loading classes...', disabled: true }]);
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: response => {
        const options = (response.data || [])
          .filter(grade => grade.is_active !== false)
          .map(grade => ({ value: String(grade.value), label: grade.label }));
        this.setGradeOptions(options);
      },
      error: () => this.setGradeOptions([])
    });
  }

  private loadSections(branchId: string | number, grade: string): void {
    this.setSectionOptions([{ value: '', label: 'Loading sections...', disabled: true }]);
    this.sectionService
      .getSections({ branch_id: branchId, grade_level: grade, per_page: 1000, is_active: true })
      .subscribe({
        next: response => {
          const options = (response.data || [])
            .filter(section => section.is_active !== false)
            .map(section => ({ value: section.name, label: section.name }));
          this.setSectionOptions(options);
        },
        error: () => this.setSectionOptions([])
      });
  }
}
