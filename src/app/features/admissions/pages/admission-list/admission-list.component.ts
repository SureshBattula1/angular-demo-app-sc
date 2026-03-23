import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AdmissionService, AdmissionApplication, AdmissionDashboard } from '../../services/admission.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { AcademicYearService, AcademicYear } from '../../../settings/services/academic-year.service';
import { ExportService } from '../../../../shared/services/export.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-admission-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    DataTableComponent,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './admission-list.component.html',
  styleUrls: ['./admission-list.component.scss']
})
export class AdmissionListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;

  loading = false;
  applications: AdmissionApplication[] = [];
  selectedApplications: AdmissionApplication[] = [];
  currentFilters: Record<string, unknown> = {};
  private academicYearSub?: Subscription;
  private destroy$ = new Subject<void>();

  branches: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  academicYears: AcademicYear[] = [];

  activeTab: 'dashboard' | 'applications' = 'dashboard';
  private loadedTabs = new Set<string>(['dashboard']);

  // Dashboard filters
  dashboardBranch: number | string = '';
  dashboardPeriod = new FormControl<'today' | 'week' | 'month' | 'custom'>('today');
  dashboardCustomFrom = new FormControl<Date | null>(null);
  dashboardCustomTo = new FormControl<Date | null>(null);
  dashboardLoading = false;

  dashboardStats: AdmissionDashboard = {
    total: 0,
    by_status: {
      Applied: 0,
      Shortlisted: 0,
      Rejected: 0,
      Admitted: 0,
      Waitlisted: 0
    },
    fee_total: 0
  };

  tableConfig: TableConfig = {
    columns: [
      { key: 'branch_name', header: 'Branch', sortable: true, searchable: true, width: '140px' },
      { key: 'application_number', header: 'Application No.', sortable: true, searchable: true, width: '160px' },
      { key: 'full_name', header: 'Applicant Name', sortable: true, searchable: true },
      { key: 'applying_for_grade_display', header: 'Applying For', sortable: true, width: '120px' },
      { key: 'academic_year', header: 'Academic Year', sortable: true, width: '130px' },
      { key: 'application_date', header: 'Application Date', type: 'date', sortable: true, width: '140px' },
      { key: 'phone', header: 'Phone', width: '130px' },
      { key: 'email', header: 'Email', searchable: true, width: '180px' },
      { key: 'referred_by', header: 'Referred By', searchable: true, width: '140px' },
      { key: 'application_status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'application_fee_paid', header: 'Fee Paid', type: 'badge', width: '100px', align: 'center', pipe: 'yesNo' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewApplication(row), permission: 'admissions.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editApplication(row), permission: 'admissions.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteApplication(row), permission: 'admissions.delete' },
      { icon: 'check_circle', label: 'Update Status', color: 'accent', action: (row) => this.updateStatus(row), permission: 'admissions.edit' },
      {
        icon: 'person_add',
        label: 'Convert to Student',
        color: 'primary',
        action: (row) => this.convertToStudent(row),
        permission: 'admissions.edit',
        show: (row) => this.canConvertToStudent(row)
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    exportButtonPermission: 'admissions.export',
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    addButtonPermission: 'admissions.create'
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Admission Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      { key: 'branch_id', label: 'Branch', type: 'select', placeholder: 'Select branch', icon: 'business', options: [] },
      {
        key: 'application_status',
        label: 'Status',
        type: 'select',
        icon: 'info',
        options: [
          { value: 'Applied', label: 'Applied' },
          { value: 'Shortlisted', label: 'Shortlisted' },
          { value: 'Rejected', label: 'Rejected' },
          { value: 'Admitted', label: 'Admitted' },
          { value: 'Waitlisted', label: 'Waitlisted' }
        ]
      },
      { key: 'applying_for_grade', label: 'Applying For Grade', type: 'select', icon: 'school', options: [], dependsOn: 'branch_id' },
      { key: 'applying_for_section', label: 'Section', type: 'select', icon: 'class', options: [], dependsOn: 'applying_for_grade' },
      { key: 'academic_year', label: 'Academic Year', type: 'select', icon: 'event', options: [] },
      { key: 'referred_by', label: 'Referred By', type: 'text', placeholder: 'Search by referrer name', icon: 'person_add' },
      {
        key: 'application_fee_paid',
        label: 'Fee Paid',
        type: 'select',
        icon: 'payment',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ]
      },
      { key: 'from_date', label: 'From Date', type: 'date', icon: 'event' },
      { key: 'to_date', label: 'To Date', type: 'date', icon: 'event' }
    ]
  };

  constructor(
    private admissionService: AdmissionService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService,
    private dialog: MatDialog,
    private academicYearContext: AcademicYearContextService,
    private academicYearService: AcademicYearService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadAcademicYears();
    this.loadDashboardStats();

    this.academicYearSub = this.academicYearContext.selectedYearId$.pipe(skip(1)).subscribe(() => {
      this.loadDashboardStats();
      if (this.loadedTabs.has('applications')) {
        this.loadApplications(this.currentFilters);
      }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['tab'] === 'applications') {
        this.switchTab('applications');
      }
    });
  }

  ngOnDestroy(): void {
    this.academicYearSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Don't load applications here - only when user switches to applications tab
  }

  switchTab(tab: 'dashboard' | 'applications'): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });

    if (!this.loadedTabs.has(tab)) {
      this.loadedTabs.add(tab);
      this.loadTabData(tab);
    }
    this.cdr.markForCheck();
  }

  isTabLoaded(tab: string): boolean {
    return this.loadedTabs.has(tab);
  }

  loadTabData(tab: string): void {
    if (tab === 'dashboard') {
      this.loadDashboardStats();
    } else if (tab === 'applications') {
      this.loadApplications();
    }
  }

  onDashboardFilterChange(): void {
    this.loadDashboardStats();
  }

  onDashboardCustomRangeChange(): void {
    if (this.dashboardCustomFrom.value && this.dashboardCustomTo.value) {
      this.loadDashboardStats();
    }
  }

  private getDashboardDateRange(): { from_date?: string; to_date?: string } {
    const period = this.dashboardPeriod.value || 'today';
    if (period === 'custom') {
      if (this.dashboardCustomFrom.value && this.dashboardCustomTo.value) {
        return {
          from_date: this.formatDate(this.dashboardCustomFrom.value),
          to_date: this.formatDate(this.dashboardCustomTo.value)
        };
      }
      return {};
    }
    const now = new Date();
    let from: Date;
    if (period === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      from = new Date(now.getFullYear(), now.getMonth(), diff);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return {
      from_date: this.formatDate(from),
      to_date: this.formatDate(now)
    };
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
  }

  loadDashboardStats(): void {
    this.dashboardLoading = true;
    this.cdr.markForCheck();

    const params: Record<string, unknown> = {};
    if (this.dashboardBranch !== '' && this.dashboardBranch != null) {
      params['branch_id'] = this.dashboardBranch;
    }
    const year = this.academicYearContext.selectedYear;
    if (year?.name) {
      params['academic_year'] = year.name;
    }
    const dateRange = this.getDashboardDateRange();
    if (dateRange.from_date) params['from_date'] = dateRange.from_date;
    if (dateRange.to_date) params['to_date'] = dateRange.to_date;

    this.admissionService.getDashboard(params).subscribe({
      next: (response) => {
        this.dashboardLoading = false;
        if (response.success && response.data) {
          this.dashboardStats = {
            total: response.data.total ?? 0,
            by_status: response.data.by_status ?? this.dashboardStats.by_status,
            fee_total: response.data.fee_total ?? 0
          };
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dashboardLoading = false;
        this.errorHandler.handleError(error);
        this.cdr.markForCheck();
      }
    });
  }

  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branches = Array.isArray(response.data) ? response.data : [];
          const branchField = this.advancedSearchConfig.fields?.find((f) => f.key === 'branch_id');
          if (branchField) {
            branchField.options = this.branches.map((b) => ({
              value: b.id,
              label: b.name || b.code
            }));
          }
        }
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  loadAcademicYears(): void {
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.academicYears = Array.isArray(response.data) ? response.data : [];
          const ayField = this.advancedSearchConfig.fields?.find((f) => f.key === 'academic_year');
          if (ayField) ayField.options = this.academicYears.map((ay) => ({ value: ay.name, label: ay.name }));
        }
      },
      error: (error) => {
        console.error('Error loading academic years:', error);
      }
    });
  }

  loadGrades(branchId?: number | string | null): void {
    const gradeField = this.advancedSearchConfig.fields?.find((f) => f.key === 'applying_for_grade');
    const sectionField = this.advancedSearchConfig.fields?.find((f) => f.key === 'applying_for_section');
    if (!branchId) {
      this.grades = [];
      this.sections = [];
      if (gradeField) gradeField.options = [];
      if (sectionField) sectionField.options = [];
      return;
    }

    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = Array.isArray(response.data) ? response.data : [];
          if (gradeField) {
            gradeField.options = this.grades.map((g) => ({ value: g.value, label: g.label || g.value }));
          }
        } else {
          this.grades = [];
          if (gradeField) gradeField.options = [];
        }
        this.sections = [];
        if (sectionField) sectionField.options = [];
      },
      error: () => {
        this.grades = [];
        this.sections = [];
        if (gradeField) gradeField.options = [];
        if (sectionField) sectionField.options = [];
      }
    });
  }

  loadSections(branchId?: number | string | null, grade?: string | null): void {
    const sectionField = this.advancedSearchConfig.fields?.find((f) => f.key === 'applying_for_section');
    if (!branchId || !grade) {
      this.sections = [];
      if (sectionField) sectionField.options = [];
      return;
    }

    this.sectionService.getSections({ branch_id: branchId, grade_level: grade, per_page: 100 }).subscribe({
      next: (response) => {
        const list = Array.isArray(response.data) ? response.data : (response as any).data?.data;
        if (response.success && Array.isArray(list)) {
          this.sections = list.filter((s: any) => s.is_active !== false);
          if (sectionField) {
            sectionField.options = this.sections.map((s: any) => ({
              value: s.name ?? s.code ?? String(s.id),
              label: s.name ?? s.code ?? String(s.id)
            }));
          }
        } else {
          this.sections = [];
          if (sectionField) sectionField.options = [];
        }
      },
      error: () => {
        this.sections = [];
        if (sectionField) sectionField.options = [];
      }
    });
  }

  loadApplications(filters: Record<string, unknown> = {}): void {
    this.loading = true;

    const params: any = {
      ...this.currentFilters,
      ...filters,
      page: filters['page'] || 1,
      per_page: filters['per_page'] || this.tableConfig.defaultPageSize || 25
    };

    const year = this.academicYearContext.selectedYear;
    if (!params['academic_year'] && year?.name) {
      params.academic_year = year.name;
    }

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    this.admissionService.getApplications(params).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          const gradeMap = new Map<string, string>(
            (this.grades || []).map((g) => [g.value, g.label || g.value])
          );
          this.applications = (response.data as any[]).map((app) => ({
            ...app,
            full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
            application_fee_paid: !!app.application_fee_paid,
            registration_fee_paid: !!app.registration_fee_paid,
            applying_for_grade_display: app.grade_label || gradeMap.get(app.applying_for_grade) || app.applying_for_grade
          }));
          if (response.meta) {
            this.tableConfig.totalCount = response.meta.total || 0;
          }
        } else {
          this.applications = [];
          this.tableConfig.totalCount = 0;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.errorHandler.handleError(error);
        this.applications = [];
        this.tableConfig.totalCount = 0;
        this.cdr.markForCheck();
      }
    });
  }

  onAction(event: { action: string; row?: any }): void {
    if (event.action === 'add') {
      this.router.navigate(['/admissions/create']);
    }
  }

  onRowClick(row: AdmissionApplication): void {
    this.viewApplication(row);
  }

  onSelectionChange(selected: AdmissionApplication[]): void {
    this.selectedApplications = selected;
  }

  onExport(format: 'excel' | 'pdf' | 'csv'): void {
    const params = { ...this.currentFilters };
    this.exportService.export(
      { endpoint: '/admissions/export', filename: `admission-applications-${new Date().getTime()}` },
      { format, filters: params }
    );
  }

  onPaginationChange(event: PaginationEvent): void {
    this.loadApplications({ page: event.page, per_page: event.pageSize });
  }

  onSortChange(event: SortEvent): void {
    this.loadApplications({ sort_by: event.field, sort_order: event.direction });
  }

  onSearchFieldChanged(event: { field: string; value: any }): void {
    if (event.field === 'branch_id') {
      this.loadGrades(event.value);
      this.currentFilters = {
        ...this.currentFilters,
        branch_id: event.value || null,
        applying_for_grade: null,
        applying_for_section: null
      };
      return;
    }

    if (event.field === 'applying_for_grade') {
      const branchId = this.currentFilters['branch_id'] as number | string | null | undefined;
      this.loadSections(branchId ?? null, event.value ? String(event.value) : null);
      this.currentFilters = {
        ...this.currentFilters,
        applying_for_grade: event.value || null,
        applying_for_section: null
      };
    }
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = { ...event.filters, search: event.query, page: 1 };
    this.loadApplications(this.currentFilters);
  }

  onSearchReset(): void {
    this.currentFilters = {};
    // Clear dependent options until user picks branch/grade again
    const gradeField = this.advancedSearchConfig.fields?.find((f) => f.key === 'applying_for_grade');
    const sectionField = this.advancedSearchConfig.fields?.find((f) => f.key === 'applying_for_section');
    if (gradeField) gradeField.options = [];
    if (sectionField) sectionField.options = [];
    this.grades = [];
    this.sections = [];
    this.loadApplications({ page: 1 });
  }

  viewApplication(application: AdmissionApplication): void {
    if (application.id) {
      this.router.navigate(['/admissions/view', application.id]);
    }
  }

  editApplication(application: AdmissionApplication): void {
    if (application.id) {
      this.router.navigate(['/admissions/edit', application.id]);
    }
  }

  deleteApplication(application: AdmissionApplication): void {
    if (confirm(`Are you sure you want to delete application ${application.application_number}?`)) {
      if (application.id) {
        this.loading = true;
        this.admissionService.deleteApplication(application.id).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              this.loadApplications();
              this.loadDashboardStats();
            }
          },
          error: (error) => {
            this.loading = false;
            this.errorHandler.handleError(error);
          }
        });
      }
    }
  }

  updateStatus(application: AdmissionApplication): void {
    this.editApplication(application);
  }

  canConvertToStudent(application: AdmissionApplication): boolean {
    if (!application) return false;
    if (application.student_id) return false;
    if (!application.applying_for_grade?.trim()) return false;
    if (application.application_status !== 'Admitted' && application.admission_decision !== 'Approved') {
      return false;
    }
    if (!application.registration_fee_paid) return false;
    return true;
  }

  convertToStudent(application: AdmissionApplication): void {
    if (!this.canConvertToStudent(application)) {
      let message = 'Cannot convert this application to student.';
      if (application.student_id) {
        message = 'This application has already been converted to a student.';
      } else if (!application.applying_for_grade?.trim()) {
        message = 'Application must have Class (Applying for Grade) set before converting to student.';
      } else if (application.application_status !== 'Admitted' && application.admission_decision !== 'Approved') {
        message = 'Application must be approved/admitted before converting to student.';
      } else if (!application.registration_fee_paid) {
        message = 'Registration fee must be paid before converting to student.';
      }
      this.errorHandler.showWarning(message);
      return;
    }

    if (
      confirm(
        `Are you sure you want to convert application ${application.application_number} to a student? This action cannot be undone.`
      )
    ) {
      this.loading = true;
      this.admissionService.convertToStudent(application.id!).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            const d = response.data || {};
            const cls = (d.grade || d.section)
              ? ` Class ${d.grade || ''}${d.section ? '-' + d.section : ''}`
              : '';
            this.errorHandler.showSuccess(
              `Application converted to student successfully! User created with Student role.${cls}`
            );
            this.loadApplications(this.currentFilters);
            this.loadDashboardStats();
            if (response.data?.student_id) {
              setTimeout(() => {
                if (confirm('Would you like to view the newly created student?')) {
                  this.router.navigate(['/students/view', response.data.student_id]);
                }
              }, 1000);
            }
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorHandler.handleError(error);
        }
      });
    }
  }
}
