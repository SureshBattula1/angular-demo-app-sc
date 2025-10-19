import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AttendanceService } from '../../services/attendance.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentAttendance, TeacherAttendance } from '../../../../core/models/attendance.model';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  template: `
    <div class="page-container">

      <app-data-table
        #dataTable
        [data]="attendanceRecords"
        [config]="tableConfig"
        [advancedSearchConfig]="advancedSearchConfig"
        [title]="'Attendances'"
        [loading]="loading"
        (actionClicked)="onAction($event)"
        (rowClicked)="onRowClick($event)"
        (selectionChanged)="onSelectionChange($event)"
        (exportClicked)="onExport($event)"
        (searchChanged)="onSearchChange($event)"
        (searchFieldChanged)="onSearchFieldChanged($event)"
        (advancedSearchChanged)="onAdvancedSearchChange($event)"
        (searchResetEvent)="onSearchReset()">
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
  allSections: Section[] = [];
  
  tableConfig: TableConfig = {
    columns: this.getStudentColumns(),
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
        // group: 'Basic Filters'
      },
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        icon: 'business',
        options: [], // Will be populated dynamically
        // group: 'Basic Filters'
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        icon: 'event',
        // group: 'Basic Filters'
      },
      {
        key: 'from_date',
        label: 'From Date',
        type: 'date',
        icon: 'event',
        // group: 'Date Range'
      },
      {
        key: 'to_date',
        label: 'To Date',
        type: 'date',
        icon: 'event',
        // group: 'Date Range'
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
        // group: 'Status Filters'
      },
      {
        key: 'grade',
        label: 'Grade',
        type: 'select',
        icon: 'school',
        options: [], // Will be populated dynamically
        // group: 'Class Filters'
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        icon: 'class',
        options: [], // Will be populated dynamically based on selected grade
        dependsOn: 'grade', // Section field depends on grade selection
        // group: 'Class Filters'
      },
      // {
      //   key: 'admission_number',
      //   label: 'Admission Number',
      //   type: 'text',
      //   icon: 'badge',
      //   placeholder: 'Enter admission number',
      //   // group: 'Student Search'
      // }
    ]
  };
  
  constructor(
    private attendanceService: AttendanceService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadGrades();
    this.loadSections();
    this.loadAttendance();
  }
  
  getStudentColumns(): TableColumn[] {
    return [
      { key: 'date', header: 'Date', sortable: true, searchable: true, width: '120px' },
      { key: 'first_name', header: 'First Name', sortable: true, searchable: true },
      { key: 'last_name', header: 'Last Name', sortable: true, searchable: true },
      { key: 'admission_number', header: 'Admission No.', searchable: true, width: '140px' },
      { key: 'grade_label', header: 'Grade', sortable: true, width: '120px' },
      { key: 'section', header: 'Section', sortable: true, width: '100px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'remarks', header: 'Remarks', width: '200px' }
    ];
  }
  
  getTeacherColumns(): TableColumn[] {
    return [
      { key: 'date', header: 'Date', sortable: true, searchable: true, width: '120px' },
      { key: 'first_name', header: 'First Name', sortable: true, searchable: true },
      { key: 'last_name', header: 'Last Name', sortable: true, searchable: true },
      { key: 'employee_id', header: 'Employee ID', searchable: true, width: '140px' },
      { key: 'email', header: 'Email', searchable: true, width: '200px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'remarks', header: 'Remarks', width: '200px' }
    ];
  }
  
  updateTableColumns(type: 'student' | 'teacher'): void {
    console.log('Updating table columns for type:', type);
    
    const newColumns = type === 'student' ? this.getStudentColumns() : this.getTeacherColumns();
    const newActions = type === 'student' 
      ? [
          { icon: 'visibility', label: 'View Details', action: (row: any) => this.viewAttendance(row) },
          { icon: 'edit', label: 'Edit', color: 'primary' as const, action: (row: any) => this.editAttendance(row) },
          { icon: 'delete', label: 'Delete', color: 'warn' as const, action: (row: any) => this.deleteAttendance(row) },
          { icon: 'assessment', label: 'Student Report', color: 'accent' as const, action: (row: any) => this.viewStudentReport(row) }
        ]
      : [
          { icon: 'visibility', label: 'View Details', action: (row: any) => this.viewAttendance(row) },
          { icon: 'edit', label: 'Edit', color: 'primary' as const, action: (row: any) => this.editAttendance(row) },
          { icon: 'delete', label: 'Delete', color: 'warn' as const, action: (row: any) => this.deleteAttendance(row) },
          { icon: 'assessment', label: 'Teacher Report', color: 'accent' as const, action: (row: any) => this.viewTeacherReport(row) }
        ];
    
    console.log('New columns:', newColumns);
    console.log('New actions:', newActions);
    
    // Create a new tableConfig object to trigger Angular change detection
    this.tableConfig = {
      ...this.tableConfig,
      columns: newColumns,
      actions: newActions
    };
    
    console.log('Table config updated, columns:', this.tableConfig.columns.length);
  }
  
  /**
   * Load all sections for filtering
   */
  loadSections(): void {
    this.sectionService.getSections().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allSections = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading sections:', error);
      }
    });
  }
  
  /**
   * Update section options based on selected grade
   */
  updateSectionOptions(selectedGrade: string | null): void {
    const sectionField = this.advancedSearchConfig.fields.find(f => f.key === 'section');
    if (sectionField) {
      if (selectedGrade) {
        // Filter sections by grade
        const filteredSections = this.allSections.filter(
          section => section.grade_level === selectedGrade
        );
        sectionField.options = filteredSections.map(section => ({
          value: section.name,
          label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
        }));
      } else {
        // Show all sections or clear
        sectionField.options = this.allSections.map(section => ({
          value: section.name,
          label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
        }));
      }
    }
  }
  
  /**
   * Load grades dynamically for advanced search filter
   */
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const gradeField = this.advancedSearchConfig.fields.find(f => f.key === 'grade');
          if (gradeField) {
            gradeField.options = response.data.map(grade => ({
              value: grade.value,
              label: grade.label
            }));
          }
        }
      },
      error: (error) => {
        console.error('Error loading grades:', error);
      }
    });
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
    
    // Merge filters and ensure type is always set
    this.currentFilters = { 
      type: 'student', // Default to student
      ...this.currentFilters, 
      ...filters 
    };
    
    console.log('Loading attendance with filters:', this.currentFilters);
    
    this.attendanceService.getAttendance(this.currentFilters).subscribe({
      next: (response) => {
        console.log('Attendance response:', response);
        if (response.success && response.data) {
          this.attendanceRecords = response.data;
          this.tableConfig.totalCount = response.meta?.total || response.data.length;
          console.log('Loaded records:', this.attendanceRecords.length);
        } else {
          this.attendanceRecords = [];
          this.tableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
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
      case 'add':
        this.markAttendance();
        break;
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
  
  onSearchChange(query: string): void {
    // Handle basic search
    this.loadAttendance({ search: query });
  }
  
  onSearchFieldChanged(event: { field: string, value: any }): void {
    console.log('Search field changed:', event.field, '=', event.value);
    
    // Update sections when grade field changes
    if (event.field === 'grade') {
      this.updateSectionOptions(event.value);
    }
    
    // Update table columns when type changes
    if (event.field === 'type') {
      console.log('Updating table columns for type:', event.value);
      this.updateTableColumns(event.value as 'student' | 'teacher');
    }
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    console.log('Advanced search changed:', event);
    
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query
    };
    
    console.log('Filters to apply:', filters);
    
    // Update columns based on type filter
    if (filters['type']) {
      console.log('Updating columns for type:', filters['type']);
      this.updateTableColumns(filters['type'] as 'student' | 'teacher');
    }
    
    this.loadAttendance(filters);
  }
  
  onSearchReset(): void {
    // Reset section options to show all sections
    this.updateSectionOptions(null);
    // Reset to student columns
    this.updateTableColumns('student');
    // Reload attendance data with default filters
    this.currentFilters = { type: 'student' };
    this.loadAttendance();
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
      this.router.navigate(['/attendance/view', attendance.student_id], { 
        queryParams: { report: 'true', type: 'student' } 
      });
    }
  }
  
  viewTeacherReport(attendance: StudentAttendance | TeacherAttendance): void {
    if ('teacher_id' in attendance) {
      this.router.navigate(['/attendance/view', attendance.teacher_id], { 
        queryParams: { report: 'true', type: 'teacher' } 
      });
    }
  }
  
  markAttendance(): void {
    this.router.navigate(['/attendance/mark']);
  }
}

