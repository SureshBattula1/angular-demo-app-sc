import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { PaginationEvent, SearchEvent, TableConfig } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { CampaignListRow, NotificationCampaignService } from '../../services/notification-campaign.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';

type HubTab = 'dashboard' | 'attendance' | 'exams' | 'fees' | 'holidays' | 'assignments';

@Component({
  selector: 'app-campaign-hub',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  templateUrl: './campaign-hub.component.html',
  styleUrls: ['./campaign-hub.component.scss']
})
export class CampaignHubComponent implements OnInit {
  tabs: Array<{ id: HubTab; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'attendance', label: 'Attendance', icon: 'fact_check' },
    { id: 'exams', label: 'Exams', icon: 'assignment' },
    { id: 'fees', label: 'Fees', icon: 'payments' },
    { id: 'holidays', label: 'Holidays', icon: 'event' },
    { id: 'assignments', label: 'Assignments', icon: 'assignment_turned_in' }
  ];

  activeTab: HubTab = 'attendance';
  loading = false;
  rows: CampaignListRow[] = [];
  dashboard: Record<string, { campaigns: number; pending: number; sent: number; failed: number; recipients: number }> = {};

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
      { key: 'scheduled_at', header: 'Scheduled', sortable: false, width: '180px' },
      { key: 'student_count', header: 'Students', sortable: false, width: '110px', align: 'center' },
      {
        key: 'status',
        header: 'Status',
        type: 'badge',
        width: '120px',
        align: 'center',
        cellClass: (row: CampaignListRow) => this.statusClass(row.status)
      }
    ],
    actions: [
      { icon: 'visibility', label: 'View', action: (row: CampaignListRow) => this.view(row) }
    ],
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
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as HubTab | null;
    if (tab && this.tabs.some(item => item.id === tab)) {
      this.activeTab = tab;
    }
    this.loadBranches();
    this.load();
  }

  switchTab(tab: string): void {
    if (!this.tabs.some(item => item.id === tab)) {
      return;
    }
    this.activeTab = tab as HubTab;
    this.page = 1;
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
    this.load();
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
      this.loading = true;
      this.campaigns.dashboard().subscribe({
        next: response => {
          this.dashboard = response.data || {};
          this.loading = false;
        },
        error: error => {
          this.errorHandler.showError(error);
          this.loading = false;
        }
      });
      return;
    }

    this.loading = true;
    this.campaigns.list({
      module: this.activeTab,
      page: this.page,
      per_page: this.perPage,
      ...this.filters
    }).subscribe({
      next: response => {
        const total = response.meta?.total || 0;
        this.rows = (response.data || []).map(row => ({
          ...row,
          class_display: this.classSectionLabel(row),
          status: this.statusLabel(row.status)
        }));
        this.tableConfig = { ...this.tableConfig, totalCount: total };
        this.loading = false;
        queueMicrotask(() => this.dataTable?.updateServerData(this.rows, total));
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  onAction(event: { action: string; row: CampaignListRow | null }): void {
    if (event.action === 'add' && this.activeTab !== 'dashboard') {
      this.router.navigate(['/notification-campaigns/schedule', this.activeTab]);
    }
  }

  onPagination(event: PaginationEvent): void {
    this.page = event.page + 1;
    this.perPage = event.pageSize;
    this.load();
  }

  classSectionLabel(row: Pick<CampaignListRow, 'class_name' | 'grade' | 'section'>): string {
    const name = row.class_name || (row.grade ? `Grade ${row.grade}` : '');
    const section = row.section ? `Section ${row.section}` : '';
    return [name, section].filter(Boolean).join(' · ') || '—';
  }

  view(row: CampaignListRow): void {
    this.router.navigate(['/notification-campaigns/view', row.id]);
  }

  statusClass(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'badge-success';
    if (value === 'failed') return 'badge-danger';
    if (value === 'partial') return 'badge-warning';
    return 'badge-warning';
  }

  statusLabel(status: string): string {
    const value = (status || '').toLowerCase();
    if (value === 'sent') return 'Sent';
    if (value === 'failed') return 'Failed';
    if (value === 'partial') return 'Partial';
    if (value === 'sending') return 'Pending';
    return 'Pending';
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: response => {
        const field = this.advancedSearchConfig.fields.find(item => item.key === 'branch_id');
        if (field) {
          field.options = (response.data || []).map(branch => ({
            value: String(branch.id),
            label: branch.name
          }));
        }
      }
    });
  }

  private setGradeOptions(options: Array<{ value: string; label: string; disabled?: boolean }>): void {
    const field = this.advancedSearchConfig.fields.find(item => item.key === 'grade');
    if (field) {
      field.options = options;
    }
  }

  private setSectionOptions(options: Array<{ value: string; label: string; disabled?: boolean }>): void {
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
    this.sectionService.getSections({ branch_id: branchId, grade_level: grade, per_page: 1000, is_active: true }).subscribe({
      next: response => {
        const options = (response.data || [])
          .filter(section => section.is_active !== false)
          .map(section => ({ value: section.name, label: section.name }));
        this.setSectionOptions(options);
      },
      error: () => this.setSectionOptions([])
    });
  }

  dashboardCards(): Array<{ key: string; label: string; stats: { campaigns: number; pending: number; sent: number; failed: number; recipients: number } }> {
    return this.tabs
      .filter(tab => tab.id !== 'dashboard')
      .map(tab => ({
        key: tab.id,
        label: tab.label,
        stats: this.dashboard[tab.id] || { campaigns: 0, pending: 0, sent: 0, failed: 0, recipients: 0 }
      }));
  }
}
