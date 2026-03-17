import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AdmissionService, AdmissionApplication } from '../../services/admission.service';
import { GradeService } from '../../../grades/services/grade.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { ExportService } from '../../../../shared/services/export.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-admission-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="applications"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Admission Applications'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (searchFieldChanged)="onSearchFieldChanged($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class AdmissionListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  applications: AdmissionApplication[] = [];
  selectedApplications: AdmissionApplication[] = [];
  currentFilters: Record<string, unknown> = {};
  private academicYearSub?: Subscription;
  
  branches: any[] = [];
  grades: any[] = [];
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'application_number', header: 'Application No.', sortable: true, searchable: true, width: '160px' },
      { key: 'full_name', header: 'Applicant Name', sortable: true, searchable: true },
      { key: 'applying_for_grade_display', header: 'Applying For', sortable: true, width: '120px' },
      { key: 'academic_year', header: 'Academic Year', sortable: true, width: '130px' },
      { key: 'application_date', header: 'Application Date', type: 'date', sortable: true, width: '140px' },
      { key: 'phone', header: 'Phone', width: '130px' },
      { key: 'email', header: 'Email', searchable: true, width: '180px' },
      { key: 'application_status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'application_fee_paid', header: 'Fee Paid', type: 'badge', width: '100px', align: 'center', pipe: 'yesNo' }
    ],
    actions: [
      { 
        icon: 'visibility', 
        label: 'View Details', 
        action: (row) => this.viewApplication(row),
        permission: 'admissions.view'
      },
      { 
        icon: 'edit', 
        label: 'Edit', 
        color: 'primary', 
        action: (row) => this.editApplication(row),
        permission: 'admissions.edit'
      },
      { 
        icon: 'delete', 
        label: 'Delete', 
        color: 'warn', 
        action: (row) => this.deleteApplication(row),
        permission: 'admissions.delete'
      },
      { 
        icon: 'check_circle', 
        label: 'Update Status', 
        color: 'accent', 
        action: (row) => this.updateStatus(row),
        permission: 'admissions.edit'
      },
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
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        placeholder: 'Select branch',
        icon: 'business',
        options: []
      },
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
      {
        key: 'applying_for_grade',
        label: 'Applying For Grade',
        type: 'select',
        icon: 'school',
        options: []
      },
      {
        key: 'academic_year',
        label: 'Academic Year',
        type: 'text',
        placeholder: '2024-2025',
        icon: 'event'
      },
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
      {
        key: 'from_date',
        label: 'From Date',
        type: 'date',
        icon: 'event'
      },
      {
        key: 'to_date',
        label: 'To Date',
        type: 'date',
        icon: 'event'
      }
    ]
  };

  constructor(
    private admissionService: AdmissionService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService,
    private dialog: MatDialog,
    private academicYearContext: AcademicYearContextService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadGrades();
    this.academicYearSub = this.academicYearContext.selectedYearId$.pipe(skip(1)).subscribe(() => this.loadApplications(this.currentFilters));
  }

  ngOnDestroy(): void {
    this.academicYearSub?.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.loadApplications();
  }

  loadBranches(): void {
    this.branchService.getBranches().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branches = Array.isArray(response.data) ? response.data : [];
          const branchField = this.advancedSearchConfig.fields?.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = this.branches.map(b => ({
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

  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = Array.isArray(response.data) ? response.data : [];
          const gradeField = this.advancedSearchConfig.fields?.find(f => f.key === 'applying_for_grade');
          if (gradeField) {
            gradeField.options = this.grades.map(g => ({
              value: g.value,
              label: g.label || g.value
            }));
          }
        }
      },
      error: (error) => {
        console.error('Error loading grades:', error);
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

    // Always scope by currently selected academic year if available
    const year = this.academicYearContext.selectedYear;
    if (year?.name) {
      params.academic_year = year.name;
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    this.admissionService.getApplications(params).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          // Build a lookup map for grade value -> label (e.g. "1" -> "Grade 1")
          const gradeMap = new Map<string, string>(
            (this.grades || []).map(g => [g.value, g.label || g.value])
          );

          this.applications = (response.data as any[]).map(app => ({
            ...app,
            full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
            // Normalize fee paid flags to booleans so they render as Yes/No
            application_fee_paid: !!app.application_fee_paid,
            registration_fee_paid: !!app.registration_fee_paid,
            // Human-friendly grade/class name for display in the table
            applying_for_grade_display: gradeMap.get(app.applying_for_grade) || app.applying_for_grade
          }));
          
          if (response.meta) {
            this.tableConfig.totalCount = response.meta.total || 0;
          }
        } else {
          this.applications = [];
          this.tableConfig.totalCount = 0;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorHandler.handleError(error);
        this.applications = [];
        this.tableConfig.totalCount = 0;
      }
    });
  }

  onAction(event: { action: string; row: any }): void {
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
    this.loadApplications({
      page: event.page,
      per_page: event.pageSize
    });
  }

  onSortChange(event: SortEvent): void {
    this.loadApplications({
      sort_by: event.field,
      sort_order: event.direction
    });
  }

  onSearchFieldChanged(event: { field: string; value: any }): void {
    // Handle field-specific changes if needed
    // For example, update dependent dropdowns
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    // Reset to first page when searching
    this.currentFilters = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadApplications(this.currentFilters);
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
    // This would typically open a dialog to update status
    // For now, navigate to edit page
    this.editApplication(application);
  }

  canConvertToStudent(application: AdmissionApplication): boolean {
    if (!application) return false;
    
    // Already converted
    if (application.student_id) return false;
    
    // Class (grade) required
    if (!application.applying_for_grade?.trim()) return false;
    
    // Status check
    if (application.application_status !== 'Admitted' && application.admission_decision !== 'Approved') {
      return false;
    }
    
    // Registration fee check
    if (!application.registration_fee_paid) {
      return false;
    }
    
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
    
    if (confirm(`Are you sure you want to convert application ${application.application_number} to a student? This action cannot be undone.`)) {
      this.loading = true;
      this.admissionService.convertToStudent(application.id!).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            const d = response.data || {};
            const cls = (d.grade || d.section) ? ` Class ${d.grade || ''}${d.section ? '-' + d.section : ''}` : '';
            this.errorHandler.showSuccess(`Application converted to student successfully! User created with Student role.${cls}`);
            // Reload applications
            this.loadApplications(this.currentFilters);
            // Optionally navigate to student view
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

