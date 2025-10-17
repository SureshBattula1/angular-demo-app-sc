import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AttendanceService } from '../../services/attendance.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentAttendance, TeacherAttendance } from '../../../../core/models/attendance.model';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1><mat-icon>fact_check</mat-icon> Attendance Management</h1>
          <p class="subtitle">View and manage attendance records</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="markAttendance()">
            <mat-icon>event_available</mat-icon>
            Mark Attendance
          </button>
        </div>
      </div>

      <app-data-table
        #dataTable
        [data]="attendanceRecords"
        [config]="tableConfig"
        [advancedSearchConfig]="advancedSearchConfig"
        [title]="''"
        [loading]="loading"
        (actionClicked)="onAction($event)"
        (rowClicked)="onRowClick($event)"
        (selectionChanged)="onSelectionChange($event)"
        (exportClicked)="onExport($event)"
        (advancedSearchChanged)="onAdvancedSearchChange($event)">
      </app-data-table>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-container { padding: 24px; max-width: 1600px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px; background: var(--card-background); border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .header-content h1 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px 0; font-size: 28px; font-weight: 600; color: var(--text-primary); }
    .header-content h1 mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--primary-color); }
    .subtitle { margin: 0; color: var(--text-secondary); font-size: 14px; }
    @media (max-width: 960px) {
      .page-container { padding: 16px; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .header-actions { width: 100%; }
      .header-actions button { width: 100%; }
    }
  `]
})
export class AttendanceListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  attendanceRecords: (StudentAttendance | TeacherAttendance)[] = [];
  selectedRecords: (StudentAttendance | TeacherAttendance)[] = [];
  currentFilters: Record<string, unknown> = { type: 'student' };
  branches: any[] = [];
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'date', header: 'Date', sortable: true, searchable: true, width: '120px' },
      { key: 'first_name', header: 'First Name', sortable: true, searchable: true },
      { key: 'last_name', header: 'Last Name', sortable: true, searchable: true },
      { key: 'admission_number', header: 'Admission No.', searchable: true, width: '140px' },
      { key: 'grade', header: 'Grade', sortable: true, width: '100px' },
      { key: 'section', header: 'Section', sortable: true, width: '100px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'remarks', header: 'Remarks', width: '200px' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewAttendance(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editAttendance(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteAttendance(row) },
      { icon: 'assessment', label: 'Student Report', color: 'accent', action: (row) => this.viewStudentReport(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Attendance Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'type',
        label: 'Attendance Type',
        type: 'select',
        icon: 'category',
        options: [
          { value: 'student', label: 'Student Attendance' },
          { value: 'teacher', label: 'Teacher Attendance' }
        ],
        defaultValue: 'student',
        group: 'Basic Filters'
      },
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        icon: 'business',
        options: [], // Will be populated dynamically
        group: 'Basic Filters'
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        icon: 'event',
        group: 'Basic Filters'
      },
      {
        key: 'from_date',
        label: 'From Date',
        type: 'date',
        icon: 'event',
        group: 'Date Range'
      },
      {
        key: 'to_date',
        label: 'To Date',
        type: 'date',
        icon: 'event',
        group: 'Date Range'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'info',
        options: [
          { value: 'Present', label: 'Present' },
          { value: 'Absent', label: 'Absent' },
          { value: 'Late', label: 'Late' },
          { value: 'Half-Day', label: 'Half Day' },
          { value: 'Sick Leave', label: 'Sick Leave' },
          { value: 'Leave', label: 'Leave' }
        ],
        group: 'Status Filters'
      },
      {
        key: 'grade',
        label: 'Grade',
        type: 'select',
        icon: 'school',
        options: [
          { value: '1', label: 'Grade 1' },
          { value: '2', label: 'Grade 2' },
          { value: '3', label: 'Grade 3' },
          { value: '4', label: 'Grade 4' },
          { value: '5', label: 'Grade 5' },
          { value: '6', label: 'Grade 6' },
          { value: '7', label: 'Grade 7' },
          { value: '8', label: 'Grade 8' },
          { value: '9', label: 'Grade 9' },
          { value: '10', label: 'Grade 10' },
          { value: '11', label: 'Grade 11' },
          { value: '12', label: 'Grade 12' }
        ],
        group: 'Class Filters'
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        icon: 'class',
        options: [
          { value: 'A', label: 'Section A' },
          { value: 'B', label: 'Section B' },
          { value: 'C', label: 'Section C' },
          { value: 'D', label: 'Section D' },
          { value: 'E', label: 'Section E' }
        ],
        group: 'Class Filters'
      },
      {
        key: 'admission_number',
        label: 'Admission Number',
        type: 'text',
        icon: 'badge',
        placeholder: 'Enter admission number',
        group: 'Student Search'
      }
    ]
  };
  
  constructor(
    private attendanceService: AttendanceService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private branchService: BranchService
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadAttendance();
  }
  
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
          // Update advanced search config with branches
          const branchField = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = this.branches.map((b: any) => ({
              value: b.id.toString(),
              label: b.name
            }));
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
      }
    });
  }
  
  loadAttendance(filters?: Record<string, unknown>): void {
    this.loading = true;
    this.currentFilters = { ...this.currentFilters, ...filters };
    
    this.attendanceService.getAttendance(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.attendanceRecords = response.data;
          this.tableConfig.totalCount = response.meta?.total || response.data.length;
        } else {
          this.attendanceRecords = [];
          this.tableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.attendanceRecords = [];
        this.tableConfig.totalCount = 0;
      }
    });
  }
  
  onAction(event: { action: string; row: any }): void {
    const attendance = event.row as StudentAttendance | TeacherAttendance;
    
    switch (event.action) {
      case 'view':
        this.viewAttendance(attendance);
        break;
      case 'edit':
        this.editAttendance(attendance);
        break;
      case 'delete':
        this.deleteAttendance(attendance);
        break;
      case 'report':
        this.viewStudentReport(attendance);
        break;
    }
  }
  
  onRowClick(row: StudentAttendance | TeacherAttendance): void {
    this.viewAttendance(row);
  }
  
  onSelectionChange(selected: (StudentAttendance | TeacherAttendance)[]): void {
    this.selectedRecords = selected;
  }
  
  onExport(format: string): void {
    this.errorHandler.showInfo(`Exporting ${this.selectedRecords.length || 'all'} records as ${format.toUpperCase()}...`);
    // Implement export logic
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    const filters = event.filters || {};
    this.loadAttendance(filters);
  }
  
  viewAttendance(attendance: StudentAttendance | TeacherAttendance): void {
    this.router.navigate(['/attendance/view', attendance.id]);
  }
  
  editAttendance(attendance: StudentAttendance | TeacherAttendance): void {
    this.router.navigate(['/attendance/edit', attendance.id]);
  }
  
  deleteAttendance(attendance: StudentAttendance | TeacherAttendance): void {
    if (confirm(`Are you sure you want to delete this attendance record for ${attendance.first_name} ${attendance.last_name}?`)) {
      this.errorHandler.showInfo('Delete functionality will be implemented with backend integration');
      // TODO: Implement delete API call
      // this.attendanceService.deleteAttendance(attendance.id).subscribe({
      //   next: () => {
      //     this.errorHandler.showSuccess('Attendance deleted successfully');
      //     this.loadAttendance();
      //   },
      //   error: (error) => this.errorHandler.showError(error)
      // });
    }
  }
  
  viewStudentReport(attendance: StudentAttendance | TeacherAttendance): void {
    if ('student_id' in attendance) {
      this.router.navigate(['/attendance/view', attendance.student_id], { queryParams: { report: true } });
    }
  }
  
  markAttendance(): void {
    this.router.navigate(['/attendance/mark']);
  }
}

