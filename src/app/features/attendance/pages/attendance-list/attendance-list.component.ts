import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AttendanceService } from '../../services/attendance.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentAttendance, TeacherAttendance } from '../../../../core/models/attendance.model';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  template: `
    <div class="page-container">
     

      <!-- Tabbed Interface -->
      <div class="tabs-container">
        <!-- Tab Header -->
        <div class="tabs-header">
          <button 
            class="tab-item" 
            [class.active]="activeTab === 'student'"
            (click)="switchTab('student')">
            <div class="tab-label-full">
              <mat-icon>school</mat-icon>
              Student Attendance
              <span class="tab-badge" *ngIf="studentCount > 0">{{ studentCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>school</mat-icon>
              Students
              <span class="tab-badge" *ngIf="studentCount > 0">{{ studentCount }}</span>
            </div>
          </button>
          
          <button 
            class="tab-item" 
            [class.active]="activeTab === 'teacher'"
            (click)="switchTab('teacher')">
            <div class="tab-label-full">
              <mat-icon>group</mat-icon>
              Teacher Attendance
              <span class="tab-badge" *ngIf="teacherCount > 0">{{ teacherCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>group</mat-icon>
              Teachers
              <span class="tab-badge" *ngIf="teacherCount > 0">{{ teacherCount }}</span>
            </div>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tabs-content">
          <!-- Student Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'student'">
            <app-data-table
              #studentDataTable
              [data]="studentRecords"
              [config]="studentTableConfig"
              [advancedSearchConfig]="studentSearchConfig"
              [title]="'Student Attendances'"
              [loading]="loading"
              (actionClicked)="onStudentAction($event)"
              (rowClicked)="onRowClick($event)"
              (selectionChanged)="onSelectionChange($event)"
              (exportClicked)="onExport($event)"
              (searchChanged)="onSearchChange($event)"
              (searchFieldChanged)="onSearchFieldChanged($event)"
              (advancedSearchChanged)="onAdvancedSearchChange($event)"
              (searchResetEvent)="onSearchReset()">
            </app-data-table>
          </div>

          <!-- Teacher Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'teacher'">
            <app-data-table
              #teacherDataTable
              [data]="teacherRecords"
              [config]="teacherTableConfig"
              [advancedSearchConfig]="teacherSearchConfig"
              [title]="'Teacher Attendances'"
              [loading]="loading"
              (actionClicked)="onTeacherAction($event)"
              (rowClicked)="onRowClick($event)"
              (selectionChanged)="onSelectionChange($event)"
              (exportClicked)="onExport($event)"
              (searchChanged)="onSearchChange($event)"
              (searchFieldChanged)="onSearchFieldChanged($event)"
              (advancedSearchChanged)="onAdvancedSearchChange($event)"
              (searchResetEvent)="onSearchReset()">
            </app-data-table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-container { max-width: 1600px; margin: 0 auto; }
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
  @ViewChild('studentDataTable') studentDataTable!: DataTableComponent;
  @ViewChild('teacherDataTable') teacherDataTable!: DataTableComponent;
  
  loading = false;
  activeTab: 'student' | 'teacher' = 'student';
  
  // Separate data arrays for each tab
  studentRecords: StudentAttendance[] = [];
  teacherRecords: TeacherAttendance[] = [];
  selectedRecords: (StudentAttendance | TeacherAttendance)[] = [];
  
  // Counts for tab badges
  studentCount = 0;
  teacherCount = 0;
  
  // Current filters
  currentFilters: Record<string, unknown> = {};
  branches: any[] = [];
  allSections: Section[] = [];
  
  // Separate table configurations
  studentTableConfig: TableConfig = {
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

  teacherTableConfig: TableConfig = {
    columns: this.getTeacherColumns(),
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewAttendance(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editAttendance(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteAttendance(row) },
      { icon: 'assessment', label: 'Teacher Report', color: 'accent', action: (row) => this.viewTeacherReport(row) }
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

  // Separate search configurations
  studentSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Student Attendance Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        icon: 'business',
        options: [],
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        icon: 'event',
      },
      {
        key: 'grade',
        label: 'Grade',
        type: 'select',
        icon: 'grade',
        options: [] // Will be populated dynamically from API
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        icon: 'class',
        options: []
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'present', label: 'Present' },
          { value: 'absent', label: 'Absent' },
          { value: 'late', label: 'Late' },
          { value: 'excused', label: 'Excused' }
        ]
      }
    ]
  };

  teacherSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Teacher Attendance Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        icon: 'business',
        options: [],
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        icon: 'event',
      },
      {
        key: 'department',
        label: 'Department',
        type: 'select',
        icon: 'business',
        options: [] // Will be populated dynamically from API
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'present', label: 'Present' },
          { value: 'absent', label: 'Absent' },
          { value: 'late', label: 'Late' },
          { value: 'excused', label: 'Excused' }
        ]
      }
    ]
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
    private route: ActivatedRoute,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private departmentService: DepartmentService
  ) {}
  
  ngOnInit(): void {
    // Check query parameters to restore active tab
    this.route.queryParams.subscribe(params => {
      const tabType = params['tab'];
      if (tabType === 'teacher') {
        this.activeTab = 'teacher';
      } else {
        this.activeTab = 'student'; // Default to student
      }
      console.log('Active tab set to:', this.activeTab);
    });
    
    this.loadBranches();
    this.loadGrades();
    this.loadSections();
    this.loadDepartments();
    this.loadStudentAttendance();
    this.loadTeacherAttendance();
  }

  // Tab switching method
  switchTab(tab: 'student' | 'teacher'): void {
    this.activeTab = tab;
    console.log('Switched to tab:', tab);
  }

  // Load student attendance
  loadStudentAttendance(filters: Record<string, any> = {}): void {
    this.loading = true;
    const params = { ...filters, type: 'student' as const };
    
    this.attendanceService.getAttendance(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.studentRecords = response.data || [];
          this.studentCount = this.studentRecords.length;
          this.studentTableConfig.totalCount = response.meta?.total || this.studentRecords.length;
        } else {
          this.studentRecords = [];
          this.studentCount = 0;
          this.studentTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.studentRecords = [];
        this.studentCount = 0;
        this.studentTableConfig.totalCount = 0;
        this.loading = false;
      }
    });
  }

  // Load teacher attendance
  loadTeacherAttendance(filters: Record<string, any> = {}): void {
    this.loading = true;
    const params = { ...filters, type: 'teacher' as const };
    
    this.attendanceService.getAttendance(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.teacherRecords = response.data || [];
          this.teacherCount = this.teacherRecords.length;
          this.teacherTableConfig.totalCount = response.meta?.total || this.teacherRecords.length;
        } else {
          this.teacherRecords = [];
          this.teacherCount = 0;
          this.teacherTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.teacherRecords = [];
        this.teacherCount = 0;
        this.teacherTableConfig.totalCount = 0;
        this.loading = false;
      }
    });
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
  
  // This method is no longer needed as we have separate table configs
  // updateTableColumns(type: 'student' | 'teacher'): void {
  //   // Method removed - using separate table configs instead
  // }
  
  /**
   * Load all sections for filtering
   */
  loadSections(): void {
    this.sectionService.getSections().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allSections = response.data;
          // Initialize section options with all sections for both configs
          this.updateSectionOptions(null);
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
    let sectionOptions;
    
    if (selectedGrade) {
      // Filter sections by grade
      const filteredSections = this.allSections.filter(
        section => section.grade_level === selectedGrade
      );
      sectionOptions = filteredSections.map(section => ({
        value: section.name,
        label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
      }));
    } else {
      // Show all sections
      sectionOptions = this.allSections.map(section => ({
        value: section.name,
        label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
      }));
    }
    
    // Update student search config
    const studentSectionField = this.studentSearchConfig.fields.find(f => f.key === 'section');
    if (studentSectionField) {
      studentSectionField.options = sectionOptions;
    }
    
    // Update old advanced search config if it exists
    const sectionField = this.advancedSearchConfig.fields.find(f => f.key === 'section');
    if (sectionField) {
      sectionField.options = sectionOptions;
    }
  }
  
  /**
   * Load grades dynamically for advanced search filter
   */
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const gradeOptions = response.data.map(grade => ({
            value: grade.value,
            label: grade.label
          }));
          
          // Update student search config
          const studentGradeField = this.studentSearchConfig.fields.find(f => f.key === 'grade');
          if (studentGradeField) {
            studentGradeField.options = gradeOptions;
          }
          
          // Update old advanced search config if it exists
          const gradeField = this.advancedSearchConfig.fields.find(f => f.key === 'grade');
          if (gradeField) {
            gradeField.options = gradeOptions;
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
          
          const branchOptions = this.branches.map((b: any) => ({
            value: b.id.toString(),
            label: b.name
          }));
          
          // Update student search config with branches
          const studentBranchField = this.studentSearchConfig.fields.find(f => f.key === 'branch_id');
          if (studentBranchField) {
            studentBranchField.options = branchOptions;
          }
          
          // Update teacher search config with branches
          const teacherBranchField = this.teacherSearchConfig.fields.find(f => f.key === 'branch_id');
          if (teacherBranchField) {
            teacherBranchField.options = branchOptions;
          }
          
          // Update old advanced search config if it exists
          const branchField = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = branchOptions;
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  /**
   * Load departments dynamically for teacher advanced search filter
   */
  loadDepartments(): void {
    this.departmentService.getDepartments({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const departmentOptions = response.data.map(dept => ({
            value: dept.name,
            label: dept.name
          }));
          
          // Update teacher search config with departments
          const teacherDeptField = this.teacherSearchConfig.fields.find(f => f.key === 'department');
          if (teacherDeptField) {
            teacherDeptField.options = departmentOptions;
          }
          
          // Update old advanced search config if it exists
          const deptField = this.advancedSearchConfig.fields.find(f => f.key === 'department');
          if (deptField) {
            deptField.options = departmentOptions;
          }
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }
  
  // This method is no longer needed as we have separate load methods
  // loadAttendance(filters?: Record<string, unknown>): void {
  //   // Method removed - using separate loadStudentAttendance and loadTeacherAttendance instead
  // }
  
  // Student tab actions
  onStudentAction(event: { action: string; row: any }): void {
    const attendance = event.row as StudentAttendance;
    
    switch (event.action) {
      case 'add':
        this.markStudentAttendance();
        break;
      case 'View Details':
        this.viewAttendance(attendance);
        break;
      case 'Edit':
        this.editAttendance(attendance);
        break;
      case 'Delete':
        this.deleteAttendance(attendance);
        break;
      case 'Student Report':
        this.viewStudentReport(attendance);
        break;
      default:
        console.log('Unknown student action:', event.action);
    }
  }

  // Teacher tab actions
  onTeacherAction(event: { action: string; row: any }): void {
    const attendance = event.row as TeacherAttendance;
    
    switch (event.action) {
      case 'add':
        this.markTeacherAttendance();
        break;
      case 'View Details':
        this.viewAttendance(attendance);
        break;
      case 'Edit':
        this.editAttendance(attendance);
        break;
      case 'Delete':
        this.deleteAttendance(attendance);
        break;
      case 'Teacher Report':
        this.viewTeacherReport(attendance);
        break;
      default:
        console.log('Unknown teacher action:', event.action);
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
    // Handle basic search - load data for active tab
    if (this.activeTab === 'student') {
      this.loadStudentAttendance({ search: query });
    } else {
      this.loadTeacherAttendance({ search: query });
    }
  }
  
  onSearchFieldChanged(event: { field: string, value: any }): void {
    console.log('Search field changed:', event.field, '=', event.value);
    
    // Update sections when grade field changes
    if (event.field === 'grade') {
      this.updateSectionOptions(event.value);
    }
    
    // Note: Type changes are now handled by tab switching
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    console.log('Advanced search changed:', event);
    
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query
    };
    
    console.log('Filters to apply:', filters);
    
    // Load data for active tab
    if (this.activeTab === 'student') {
      this.loadStudentAttendance(filters);
    } else {
      this.loadTeacherAttendance(filters);
    }
  }
  
  onSearchReset(): void {
    // Reset section options to show all sections
    this.updateSectionOptions(null);
    
    // Load fresh data for active tab
    if (this.activeTab === 'student') {
      this.loadStudentAttendance();
    } else {
      this.loadTeacherAttendance();
    }
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
  
  // Mark student attendance
  markStudentAttendance(): void {
    this.router.navigate(['/attendance/mark'], {
      queryParams: { type: 'student' }
    });
  }

  // Mark teacher attendance
  markTeacherAttendance(): void {
    this.router.navigate(['/attendance/mark'], {
      queryParams: { type: 'teacher' }
    });
  }
}


