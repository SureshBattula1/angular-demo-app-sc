import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, skip } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  PaginationEvent,
  SearchEvent,
  SortEvent,
  TableColumn,
  TableConfig
} from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { Branch } from '../../../../core/models/branch.model';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { BranchService } from '../../../branches/services/branch.service';
import { extractLaravelPaginatorData } from '../../services/sms-bulk-log.service';
import {
  SmsBulkLogDetailData,
  SmsBulkQueueRow,
  SmsBulkRecipientRow,
  WhatsAppBulkLogService
} from '../../services/whatsapp-bulk-log.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { SmsSendPanelComponent } from '../sms-send-panel/sms-send-panel.component';

/** Queue row mapped for app-data-table */
export type SmsQueueTableRow = SmsBulkQueueRow & {
  started_display: string;
  counts_summary: string;
  batch_status_label: string;
  branch_name?: string;
  academic_year_name?: string;
};

@Component({
  selector: 'app-whatsapp-tab-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    DataTableComponent,
    SmsSendPanelComponent
  ],
  inputs: ['branchId', 'shellBranches'],
  templateUrl: './whatsapp-tab-page.component.html',
  styleUrls: ['./whatsapp-tab-page.component.scss']
})
export class WhatsAppTabPageComponent implements OnInit, OnChanges {
  @ViewChild('queueTable') queueTable?: DataTableComponent;

  private logApi = inject(WhatsAppBulkLogService);
  private branchService = inject(BranchService);
  private permission = inject(PermissionService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private academicYearContext = inject(AcademicYearContextService);

  branchId: number | string | null = null;

  /** Branches from bulk shell (already loaded) — avoids duplicate fetch + branch loading spinner. */
  shellBranches: Branch[] = [];

  @Input() canViewAllBranches = false;

  /** Delivery log (data-table) vs send WhatsApp panel */
  view: 'delivery' | 'send' = 'delivery';

  /** From URL `waQueue` — when set, show full-page batch recipients (separate from list). */
  batchDetailQueueId: number | null = null;

  branches: Branch[] = [];
  selectedBranchId: string | number | null = null;

  /** False until branches are known (from shell or API). */
  branchListReady = false;

  queuesLoading = false;
  queueRows: SmsQueueTableRow[] = [];
  queuePageIndex = 0;
  queuePageSize = 15;

  /** Server-side search + advanced filters (same pattern as SMS Templates / branch list). */
  queueSearchQuery = '';
  queueFilters: Record<string, unknown> = {};
  queueSortField = 'id';
  queueSortDirection: 'asc' | 'desc' = 'desc';

  tableConfig: TableConfig = {
    columns: [],
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: false,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 15, 25, 50],
    defaultPageSize: 15,
    selectable: false,
    primaryButtonLabel: 'Send WhatsApp',
    primaryButtonIcon: 'send'
  };

  /** Built when branches load; includes Branch in the advanced search drawer (replacing the old toolbar). */
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Search WhatsApp log',
    width: '380px',
    showReset: true,
    showSaveSearch: false,
    fields: []
  };

  selectedQueue: SmsBulkQueueRow | null = null;
  detailLoading = false;
  detail: SmsBulkLogDetailData | null = null;
  recipientStatusFilter = '';
  recipientsPageIndex = 0;
  recipientsPageSize = 50;

  resending = false;

  recipientColumns: string[] = ['name', 'type', 'id', 'status', 'error', 'sent_at'];

  /** True when viewing a single batch’s recipients as its own screen (row click or deep link). */
  get showBatchDetailPage(): boolean {
    return this.view === 'delivery' && this.batchDetailQueueId !== null;
  }

  private syncQueueTableColumns(): void {
    const cols: TableColumn[] = [
      { key: 'id', header: '#', sortable: true, searchable: true, width: '88px' },
      {
        key: 'started_display',
        header: 'Started',
        sortable: true,
        searchable: true,
        width: '200px'
      }
    ];
    if (this.canViewAllBranches) {
      cols.push({
        key: 'branch_name',
        header: 'Branch',
        sortable: true,
        searchable: true,
        width: '160px'
      });
    }
    cols.push(
      {
        key: 'academic_year_name',
        header: 'Academic year',
        sortable: true,
        searchable: true,
        width: '140px'
      },
      {
        key: 'batch_status_label',
        header: 'Batch',
        type: 'badge',
        sortable: true,
        searchable: true,
        width: '120px',
        align: 'center'
      },
      {
        key: 'counts_summary',
        header: 'Sent / Fail / Skip / Pending',
        sortable: false,
        searchable: false
      },
      { key: 'provider', header: 'Provider', sortable: true, searchable: true, width: '130px' }
    );
    this.tableConfig = {
      ...this.tableConfig,
      columns: cols
    };
  }

  ngOnInit(): void {
    this.syncQueueTableColumns();
    this.academicYearContext.selectedYearId$
      .pipe(distinctUntilChanged(), skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.branchListReady && this.view === 'delivery' && this.batchDetailQueueId === null) {
          this.queuePageIndex = 0;
          this.queueTable?.resetServerState();
          this.loadQueues();
        }
      });
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const hadBatch = this.batchDetailQueueId !== null;
      this.applyWaQueryParams(params as Record<string, string | undefined>);
      if (this.batchDetailQueueId !== null && this.selectedBranchId !== null) {
        this.openBatchDetailFromRoute();
      } else if (hadBatch && this.batchDetailQueueId === null && this.view === 'delivery') {
        this.resetDetail();
        this.loadQueues();
      }
    });
    if (this.shellBranches?.length) {
      this.finalizeBranchesList([...this.shellBranches]);
    } else {
      this.loadBranches();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['canViewAllBranches']) {
      this.syncQueueTableColumns();
    }
    if (changes['shellBranches'] && this.shellBranches?.length && this.branches.length === 0) {
      this.finalizeBranchesList([...this.shellBranches]);
    }
    if (changes['branchId']) {
      // Parent shell sets `bulkBranchId` to the first branch after branches load. That must not
      // override `waBranch` from the URL or call `onBranchChanged()` (which strips waQueue/waBranch).
      if (this.hasWaBatchDeepLinkInUrl()) {
        return;
      }
      if (this.canViewAllBranches) {
        return;
      }
      const v = this.normalizeBranchId(this.branchId);
      if (v !== null) {
        this.selectedBranchId = v;
        this.onBranchChanged();
      }
    }
  }

  /** True when route has batch deep-link params (recipients view for a specific queue + branch). */
  private hasWaBatchDeepLinkInUrl(): boolean {
    const qp = this.route.snapshot.queryParams;
    const q = qp['waQueue'];
    const b = qp['waBranch'];
    return q != null && String(q).trim() !== '' && b != null && String(b).trim() !== '';
  }

  private normalizeBranchId(v: number | string | null): number | null {
    if (v === '' || v === null || v === undefined) {
      return null;
    }
    const n = typeof v === 'string' ? parseInt(v, 10) : v;
    return Number.isFinite(n) ? n : null;
  }

  get canResend(): boolean {
    return true;
  }

  /** Apply branch list and load queue log (shared by shell hydration and API). */
  private finalizeBranchesList(branchList: Branch[]): void {
    this.branches = branchList;
    this.branchListReady = true;
    this.syncQueueTableColumns();
    const fromInput = this.normalizeBranchId(this.branchId);
    this.applyWaQueryParams(this.route.snapshot.queryParams as Record<string, string | undefined>);
    if (this.selectedBranchId === null && fromInput !== null && !this.canViewAllBranches) {
      this.selectedBranchId = fromInput;
    }
    if (!this.canViewAllBranches && this.selectedBranchId === null && branchList.length > 0) {
      this.selectedBranchId = this.normalizeBranchId(branchList[0].id);
    }
    if (this.canViewAllBranches || this.selectedBranchId !== null) {
      this.rebuildAdvancedSearchConfig();
      if (this.batchDetailQueueId !== null) {
        this.openBatchDetailFromRoute();
      } else {
        this.loadQueues();
      }
    }
  }

  private loadBranches(): void {
    this.branchService
      .getBranches({ is_active: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          if (res.success && res.data?.length) {
            this.finalizeBranchesList(res.data);
          } else {
            this.branchListReady = true;
            this.branches = [];
          }
        },
        error: () => {
          this.branchListReady = true;
          this.branches = [];
        }
      });
  }

  private rebuildAdvancedSearchConfig(): void {
    const branchOptions: { value: number | string; label: string }[] = [];
    if (this.canViewAllBranches) {
      branchOptions.push({ value: '', label: 'All branches' });
    }
    branchOptions.push(...this.branches.map(b => ({ value: b.id, label: b.name })));
    this.advancedSearchConfig = {
      title: 'Search WhatsApp log',
      width: '380px',
      showReset: true,
      showSaveSearch: false,
      fields: [
        {
          key: 'branch_id',
          label: 'Branch',
          type: 'select',
          placeholder: 'Select branch',
          icon: 'business',
          options: branchOptions,
          defaultValue:
            this.selectedBranchId ??
            (this.canViewAllBranches ? '' : (this.branches[0]?.id as string | number | undefined))
        },
        {
          key: 'batch_status',
          label: 'Batch status',
          type: 'select',
          placeholder: 'Any',
          icon: 'flag',
          options: [
            { value: '', label: 'Any' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
            { value: 'queued', label: 'Queued (legacy)' }
          ]
        },
        {
          key: 'provider',
          label: 'Provider',
          type: 'text',
          placeholder: 'e.g. twilio, msg91',
          icon: 'cloud'
        }
      ]
    };
  }

  private onBranchChanged(): void {
    this.clearBatchDetailQueryParams();
    this.resetDetail();
    this.queueSearchQuery = '';
    this.queueFilters = {};
    this.queueSortField = 'id';
    this.queueSortDirection = 'desc';
    this.queuePageIndex = 0;
    this.queuePageSize = 15;
    this.queueTable?.resetServerState();
    this.rebuildAdvancedSearchConfig();
    this.loadQueues();
  }

  onQueueAdvancedSearch(ev: SearchEvent): void {
    const filters = { ...(ev.filters ?? {}) };
    const rawBranch = filters['branch_id'];
    if (this.canViewAllBranches && (rawBranch === '' || rawBranch === null || rawBranch === undefined)) {
      this.selectedBranchId = null;
    } else if (rawBranch !== undefined && rawBranch !== null && rawBranch !== '') {
      const n = typeof rawBranch === 'number' ? rawBranch : parseInt(String(rawBranch), 10);
      if (!Number.isNaN(n) && this.branches.some(b => String(b.id) === String(n))) {
        this.selectedBranchId = n;
      }
    }
    this.queueSearchQuery = ev.query ?? '';
    this.queueFilters = filters;
    this.queuePageIndex = 0;
    this.queueTable?.resetServerState();
    this.loadQueues();
  }

  onQueueSearchReset(): void {
    this.queueSearchQuery = '';
    this.queueFilters = {};
    this.queueSortField = 'id';
    this.queueSortDirection = 'desc';
    this.queuePageIndex = 0;
    const fromInput = this.normalizeBranchId(this.branchId);
    if (this.canViewAllBranches) {
      this.selectedBranchId = fromInput ?? null;
    } else {
      this.selectedBranchId = fromInput ?? this.normalizeBranchId(this.branches[0]?.id ?? null);
    }
    this.queueTable?.resetServerState();
    this.rebuildAdvancedSearchConfig();
    this.loadQueues();
  }

  onQueueSort(ev: SortEvent): void {
    this.queueSortField = ev.field || 'id';
    this.queueSortDirection = ev.direction === 'asc' ? 'asc' : 'desc';
    this.queuePageIndex = 0;
    this.queueTable?.resetServerState();
    this.loadQueues();
  }

  private applyWaQueryParams(params: Record<string, string | undefined>): void {
    const rawQ = params['waQueue'];
    if (rawQ != null && rawQ !== '') {
      const n = parseInt(String(rawQ), 10);
      this.batchDetailQueueId = !Number.isNaN(n) ? n : null;
    } else {
      this.batchDetailQueueId = null;
    }
    const rawB = params['waBranch'];
    if (rawB != null && rawB !== '') {
      const b = parseInt(String(rawB), 10);
      if (!Number.isNaN(b)) {
        this.selectedBranchId = b;
      }
    }
  }

  private clearBatchDetailQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { waQueue: null, waBranch: null },
      queryParamsHandling: 'merge'
    });
  }

  private openBatchDetailFromRoute(): void {
    if (this.batchDetailQueueId === null || this.selectedBranchId === null) {
      return;
    }
    this.recipientsPageIndex = 0;
    this.selectedQueue = { id: this.batchDetailQueueId } as SmsBulkQueueRow;
    this.loadDetail();
  }

  private resetDetail(): void {
    this.selectedQueue = null;
    this.detail = null;
    this.recipientStatusFilter = '';
    this.recipientsPageIndex = 0;
  }

  openSendSms(): void {
    this.clearBatchDetailQueryParams();
    this.view = 'send';
  }

  backToDeliveryLog(): void {
    this.view = 'delivery';
    this.loadQueues();
  }

  /** After bulk WhatsApp is queued, return to the delivery log list and refresh. */
  onBulkQueued(): void {
    this.clearBatchDetailQueryParams();
    this.batchDetailQueueId = null;
    this.resetDetail();
    this.view = 'delivery';
    this.queuePageIndex = 0;
    this.queueTable?.resetServerState();
    this.loadQueues();
  }

  /** Back from full-page batch recipients to the delivery log table. */
  backToDeliveryLogFromBatch(): void {
    this.clearBatchDetailQueryParams();
  }

  onQueueAction(ev: { action: string; row: unknown }): void {
    if (ev.action === 'add') {
      this.openSendSms();
    }
  }

  onQueueRowClick(row: SmsQueueTableRow): void {
    const branchForRow = row.branch_id ?? this.selectedBranchId;
    if (branchForRow === null) {
      return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tab: 'whatsapp',
        waQueue: row.id,
        waBranch: branchForRow
      },
      queryParamsHandling: 'merge'
    });
  }

  onQueuePagination(ev: PaginationEvent): void {
    this.queuePageIndex = ev.page;
    this.queuePageSize = ev.pageSize;
    this.loadQueues();
  }

  loadQueues(): void {
    if (this.selectedBranchId === null && !this.canViewAllBranches) {
      return;
    }
    if (this.batchDetailQueueId !== null) {
      return;
    }
    this.queuesLoading = true;
    let branchParam: string | number | null | undefined = this.selectedBranchId;
    const fb = this.queueFilters['branch_id'];
    if (fb !== undefined && fb !== null && String(fb).trim() !== '') {
      const n = typeof fb === 'number' ? fb : parseInt(String(fb), 10);
      if (!Number.isNaN(n)) {
        branchParam = n;
      }
    }
    this.logApi
      .listLogs(
        branchParam,
        this.queuePageIndex + 1,
        this.queuePageSize,
        {
          search: this.queueSearchQuery.trim() || undefined,
          batch_status:
            typeof this.queueFilters['batch_status'] === 'string' &&
            (this.queueFilters['batch_status'] as string).trim() !== ''
              ? (this.queueFilters['batch_status'] as string).trim()
              : undefined,
          provider:
            typeof this.queueFilters['provider'] === 'string' &&
            (this.queueFilters['provider'] as string).trim() !== ''
              ? (this.queueFilters['provider'] as string).trim()
              : undefined,
          sort_by: this.queueSortField,
          sort_direction: this.queueSortDirection
        },
        this.academicYearContext.effectiveYearId()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.queuesLoading = false;
          if (res.success && res.data) {
            const { rows: raw, total } = extractLaravelPaginatorData<SmsBulkQueueRow>(res.data);
            this.queueRows = raw.map(q => this.toQueueRow(q));
            this.tableConfig = {
              ...this.tableConfig,
              totalCount: total
            };
          } else {
            this.queueRows = [];
            this.tableConfig = { ...this.tableConfig, totalCount: 0 };
          }
        },
        error: () => {
          this.queuesLoading = false;
          this.queueRows = [];
          this.tableConfig = { ...this.tableConfig, totalCount: 0 };
          this.snack.open('Could not load WhatsApp send logs.', 'Dismiss', { duration: 4000 });
        }
      });
  }

  private toQueueRow(q: SmsBulkQueueRow): SmsQueueTableRow {
    const n = (v: unknown): number =>
      typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || 0;
    return {
      ...q,
      recipients_sent: n(q.recipients_sent),
      recipients_failed: n(q.recipients_failed),
      recipients_skipped: n(q.recipients_skipped),
      recipients_pending: n(q.recipients_pending),
      started_display: this.formatDate(q.created_at),
      batch_status_label: this.formatBatchStatus(q.status),
      branch_name: q.branch_name ?? '—',
      academic_year_name: q.academic_year_name ?? '—',
      counts_summary: `${n(q.recipients_sent)} / ${n(q.recipients_failed)} / ${n(q.recipients_skipped)} / ${n(q.recipients_pending)}`
    };
  }

  private formatBatchStatus(s: string): string {
    if (!s) {
      return '—';
    }
    // DB/migration legacy used "queued"; runtime uses "processing" until jobs finish.
    if (s === 'queued' || s === 'processing') {
      return 'Processing';
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  onRecipientFilterChange(): void {
    this.recipientsPageIndex = 0;
    this.loadDetail();
  }

  onRecipientsPage(ev: PageEvent): void {
    this.recipientsPageIndex = ev.pageIndex;
    this.recipientsPageSize = ev.pageSize;
    this.loadDetail();
  }

  private loadDetail(): void {
    if (this.selectedQueue === null) {
      return;
    }
    const branchForApi = this.selectedQueue.branch_id ?? this.selectedBranchId;
    if (branchForApi === null) {
      return;
    }
    this.detailLoading = true;
    const status =
      this.recipientStatusFilter === '' ? undefined : this.recipientStatusFilter;
    this.logApi
      .getDetail(
        branchForApi,
        this.selectedQueue.id,
        this.recipientsPageIndex + 1,
        this.recipientsPageSize,
        status
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.detailLoading = false;
          if (res.success && res.data) {
            this.detail = res.data;
            this.selectedQueue = res.data.queue;
          } else {
            this.detail = null;
          }
        },
        error: () => {
          this.detailLoading = false;
          this.detail = null;
          this.snack.open('Could not load recipient details.', 'Dismiss', { duration: 4000 });
        }
      });
  }

  resendFailedSkipped(): void {
    const branchForApi = this.selectedQueue?.branch_id ?? this.selectedBranchId;
    if (!this.canResend || branchForApi === null || this.selectedQueue === null) {
      return;
    }
    this.resending = true;
    this.logApi
      .resend(branchForApi, this.selectedQueue.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.resending = false;
          if (res.success) {
            this.snack.open(res.message ?? 'Resend queued.', 'Dismiss', { duration: 5000 });
            if (this.batchDetailQueueId === null) {
              this.loadQueues();
            }
            this.loadDetail();
          } else {
            this.snack.open(res.message ?? 'Resend failed.', 'Dismiss', { duration: 5000 });
          }
        },
        error: err => {
          this.resending = false;
          const msg = err?.error?.message ?? 'Could not queue resend.';
          this.snack.open(msg, 'Dismiss', { duration: 5000 });
        }
      });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'sent':
        return 'sms-tab-status sms-tab-status--sent';
      case 'failed':
        return 'sms-tab-status sms-tab-status--failed';
      case 'skipped':
        return 'sms-tab-status sms-tab-status--skipped';
      case 'pending':
        return 'sms-tab-status sms-tab-status--pending';
      default:
        return 'sms-tab-status';
    }
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return d.toLocaleString();
  }

  recipientsData(): SmsBulkRecipientRow[] {
    return this.detail?.recipients?.data ?? [];
  }

  recipientsTotal(): number {
    return this.detail?.recipients?.total ?? 0;
  }

  /** Branch id for send panel (must match dropdown). */
  sendPanelBranchId(): number | string | null {
    return this.selectedBranchId ?? this.branchId;
  }
}
