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
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentAttendance, TeacherAttendance } from '../../../../core/models/attendance.model';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  template: `
    <div class="page-container">
      <!-- Tabs Container -->
      <div class="tabs-container">
        <div class="tabs-header">
          <button 
            class="tab-item"
            [class.active]="activeTab === 'student'"
            (click)="switchTab('student')"
            attr.aria-selected="{{activeTab === 'student'}}"
            role="tab">
            <mat-icon>school</mat-icon>
            <span class="tab-label-full">Student Attendance</span>
            <span class="tab-label-short">Students</span>
            <span class="tab-badge" *ngIf="studentCount > 0">{{studentCount}}</span>
          </button>
          <button 
            class="tab-item"
            [class.active]="activeTab === 'teacher'"
            (click)="switchTab('teacher')"
            attr.aria-selected="{{activeTab === 'teacher'}}"
            role="tab">
            <mat-icon>person</mat-icon>
            <span class="tab-label-full">Teacher Attendance</span>
            <span class="tab-label-short">Teachers</span>
            <span class="tab-badge" *ngIf="teacherCount > 0">{{teacherCount}}</span>
          </button>
        </div>

        <div class="tabs-content">
          <!-- Student Tab Content -->
          <div class="tab-pane" [class.active]="activeTab === 'student'" role="tabpanel">
            <app-data-table
              #studentDataTable
              [data]="studentRecords"
              [config]="studentTableConfig"
              [advancedSearchConfig]="studentAdvancedSearchConfig"
              [title]="'Student Attendance Records'"
              [loading]="loading"
              (actionClicked)="onStudentAction($event)"
              (rowClicked)="onStudentRowClick($event)"
              (selectionChanged)="onStudentSelectionChange($event)"
              (exportClicked)="onExport($event, 'student')"
              (searchChanged)="onStudentSearchChange($event)"
              (searchFieldChanged)="onStudentSearchFieldChanged($event)"
              (advancedSearchChanged)="onStudentAdvancedSearchChange($event)"
              (searchResetEvent)="onStudentSearchReset()">
            </app-data-table>
          </div>

          <!-- Teacher Tab Content -->
          <div class="tab-pane" [class.active]="activeTab === 'teacher'" role="tabpanel">
            <app-data-table
              #teacherDataTable
              [data]="teacherRecords"
              [config]="teacherTableConfig"
              [advancedSearchConfig]="teacherAdvancedSearchConfig"
              [title]="'Teacher Attendance Records'"
              [loading]="loading"
              (actionClicked)="onTeacherAction($event)"
              (rowClicked)="onTeacherRowClick($event)"
              (selectionChanged)="onTeacherSelectionChange($event)"
              (exportClicked)="onExport($event, 'teacher')"
              (searchChanged)="onTeacherSearchChange($event)"
              (searchFieldChanged)="onTeacherSearchFieldChanged($event)"
              (advancedSearchChanged)="onTeacherAdvancedSearchChange($event)"
              (searchResetEvent)="onTeacherSearchReset()">
            </app-data-table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-container { 
      padding: 24px; 
      max-width: 1600px; 
      margin: 0 auto; 
    }

    /* Mobile Responsive */
    @media (max-width: 599px) {
      .page-container { 
        padding: 12px; 
      }
    }

    @media (min-width: 600px) and (max-width: 959px) {
      .page-container { 
        padding: 16px; 
      }
    }
  `]
})
export class AttendanceListComponent implements OnInit {
  @ViewChild('studentDataTable') studentDataTable!: DataTableComponent;
  @ViewChild('teacherDataTable') teacherDataTable!: DataTableComponent;
  
  // Active Tab Management
  activeTab: 'student' | 'teacher' = 'student';
  
  // Loading State
  loading = false;
  
  // Student Data
  studentRecords: StudentAttendance[] = [];
  selectedStudentRecords: StudentAttendance[] = [];
  studentFilters: Record<string, unknown> = {};
  studentCount = 0;
  
  // Teacher Data
  teacherRecords: TeacherAttendance[] = [];
  selectedTeacherRecords: TeacherAttendance[] = [];
  teacherFilters: Record<string, unknown> = {};
  teacherCount = 0;
  
  // Reference Data
  branches: any[] = [];
  allSections: Section[] = [];
  
  // Student Table Configuration
  studentTableConfig: TableConfig = {
    columns: [],
    actions: [],
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
  
  // Teacher Table Configuration
  teacherTableConfig: TableConfig = {
    columns: [],
    actions: [],
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
  
  // Student Advanced Search Configuration
  studentAdvancedSearchConfig: AdvancedSearchConfig = {
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
        options: []
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        icon: 'event'
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
        ]
      },
      {
        key: 'grade',
        label: 'Grade',
        type: 'select',
        icon: 'school',
        options: []
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        icon: 'class',
        options: [],
        dependsOn: 'grade'
      }
    ]
  };
  
  // Teacher Advanced Search Configuration
  teacherAdvancedSearchConfig: AdvancedSearchConfig = {
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
        options: []
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        icon: 'event'
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
        ]
      },
      {
        key: 'department',
        label: 'Department',
        type: 'select',
        icon: 'apartment',
        options: []
      }
    ]
  };
  
  constructor(
    private attendanceService: AttendanceService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService
  ) {}
  
  ngOnInit(): void {
    this.initializeTableConfigs();
    
    // Check query parameters to restore active tab
    this.route.queryParams.subscribe(params => {
      const tabType = params['tab'];
      if (tabType === 'teacher') {
        this.activeTab = 'teacher';
        this.loadTeacherAttendance();
      } else {
        this.activeTab = 'student';
        this.loadStudentAttendance();
      }
    });
    
    this.loadBranches();
    this.loadGrades();
    this.loadSections();
  }
  
  /**
   * Initialize table configurations with proper action bindings
   */
  initializeTableConfigs(): void {
    console.log('Initializing table configurations...');
    
    // Student Table Actions
    this.studentTableConfig.columns = this.getStudentColumns();
    this.studentTableConfig.actions = [
      { 
        icon: 'visibility', 
        label: 'View Details', 
        action: (row) => {
          console.log('View Details action clicked for student:', row);
          this.viewAttendance(row, 'student');
        }
      },
      { 
        icon: 'edit', 
        label: 'Edit', 
        color: 'primary', 
        action: (row) => {
          console.log('Edit action clicked for student:', row);
          this.editAttendance(row, 'student');
        }
      },
      { 
        icon: 'delete', 
        label: 'Delete', 
        color: 'warn', 
        action: (row) => {
          console.log('Delete action clicked for student:', row);
          this.deleteAttendance(row, 'student');
        }
      },
      { 
        icon: 'assessment', 
        label: 'Student Report', 
        color: 'accent', 
        action: (row) => {
          console.log('Student Report action clicked:', row);
          this.viewStudentReport(row);
        }
      }
    ];
    
    // Teacher Table Actions
    this.teacherTableConfig.columns = this.getTeacherColumns();
    this.teacherTableConfig.actions = [
      { 
        icon: 'visibility', 
        label: 'View Details', 
        action: (row) => {
          console.log('View Details action clicked for teacher:', row);
          this.viewAttendance(row, 'teacher');
        }
      },
      { 
        icon: 'edit', 
        label: 'Edit', 
        color: 'primary', 
        action: (row) => {
          console.log('Edit action clicked for teacher:', row);
          this.editAttendance(row, 'teacher');
        }
      },
      { 
        icon: 'delete', 
        label: 'Delete', 
        color: 'warn', 
        action: (row) => {
          console.log('Delete action clicked for teacher:', row);
          this.deleteAttendance(row, 'teacher');
        }
      },
      { 
        icon: 'assessment', 
        label: 'Teacher Report', 
        color: 'accent', 
        action: (row) => {
          console.log('Teacher Report action clicked:', row);
          this.viewTeacherReport(row);
        }
      }
    ];
    
    console.log('Table configurations initialized. Student actions:', this.studentTableConfig.actions.length);
    console.log('Teacher actions:', this.teacherTableConfig.actions.length);
  }
  
  /**
   * Switch between Student and Teacher tabs
   */
  switchTab(tab: 'student' | 'teacher'): void {
    console.log('Switching to tab:', tab);
    this.activeTab = tab;
    
    // Always reload data when switching tabs to ensure fresh data
    if (tab === 'teacher') {
      console.log('Loading teacher attendance...');
      this.loadTeacherAttendance();
    } else {
      console.log('Loading student attendance...');
      this.loadStudentAttendance();
    }
  }
  
  /**
   * Get Student Table Columns
   */
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
  
  /**
   * Get Teacher Table Columns
   */
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
  
  /**
   * Load Branches for both search configs
   */
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
          const branchOptions = this.branches.map((b: any) => ({
            value: b.id.toString(),
            label: b.name
          }));
          
          // Update both student and teacher search configs
          const studentBranchField = this.studentAdvancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (studentBranchField) {
            studentBranchField.options = branchOptions;
          }
          
          const teacherBranchField = this.teacherAdvancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (teacherBranchField) {
            teacherBranchField.options = branchOptions;
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
      }
    });
  }
  
  /**
   * Load Grades for student search config
   */
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const gradeField = this.studentAdvancedSearchConfig.fields.find(f => f.key === 'grade');
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
  
  /**
   * Load Sections for student search config
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
    const sectionField = this.studentAdvancedSearchConfig.fields.find(f => f.key === 'section');
    if (sectionField) {
      if (selectedGrade) {
        const filteredSections = this.allSections.filter(
          section => section.grade_level === selectedGrade
        );
        sectionField.options = filteredSections.map(section => ({
          value: section.name,
          label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
        }));
      } else {
        sectionField.options = this.allSections.map(section => ({
          value: section.name,
          label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
        }));
      }
    }
  }
  
  /**
   * Load Student Attendance
   */
  loadStudentAttendance(filters?: Record<string, unknown>): void {
    this.loading = true;
    this.studentFilters = { type: 'student', ...this.studentFilters, ...filters };
    
    this.attendanceService.getAttendance(this.studentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.studentRecords = response.data as StudentAttendance[];
          this.studentCount = response.meta?.total || this.studentRecords.length;
          this.studentTableConfig.totalCount = this.studentCount;
        } else {
          this.studentRecords = [];
          this.studentCount = 0;
          this.studentTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student attendance:', error);
        this.errorHandler.showError(error);
        this.loading = false;
        this.studentRecords = [];
        this.studentCount = 0;
        this.studentTableConfig.totalCount = 0;
      }
    });
  }
  
  /**
   * Load Teacher Attendance
   */
  loadTeacherAttendance(filters?: Record<string, unknown>): void {
    this.loading = true;
    this.teacherFilters = { type: 'teacher', ...this.teacherFilters, ...filters };
    
    this.attendanceService.getAttendance(this.teacherFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teacherRecords = response.data as TeacherAttendance[];
          this.teacherCount = response.meta?.total || this.teacherRecords.length;
          this.teacherTableConfig.totalCount = this.teacherCount;
        } else {
          this.teacherRecords = [];
          this.teacherCount = 0;
          this.teacherTableConfig.totalCount = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teacher attendance:', error);
        this.errorHandler.showError(error);
        this.loading = false;
        this.teacherRecords = [];
        this.teacherCount = 0;
        this.teacherTableConfig.totalCount = 0;
      }
    });
  }
  
  // ============================================
  // STUDENT TAB HANDLERS
  // ============================================
  
  onStudentAction(event: { action: string; row: any }): void {
    console.log('onStudentAction called:', event);
    
    // Handle 'add' action (no row needed)
    if (event.action === 'add') {
      this.markStudentAttendance();
      return;
    }
    
    const attendance = event.row as StudentAttendance;
    
    switch (event.action) {
      case 'View Details':
        this.viewAttendance(attendance, 'student');
        break;
      case 'Edit':
        this.editAttendance(attendance, 'student');
        break;
      case 'Delete':
        this.deleteAttendance(attendance, 'student');
        break;
      case 'Student Report':
        this.viewStudentReport(attendance);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }
  
  onStudentRowClick(row: StudentAttendance): void {
    this.viewAttendance(row, 'student');
  }
  
  onStudentSelectionChange(selected: StudentAttendance[]): void {
    this.selectedStudentRecords = selected;
  }
  
  onStudentSearchChange(query: string): void {
    this.loadStudentAttendance({ search: query });
  }
  
  onStudentSearchFieldChanged(event: { field: string, value: any }): void {
    if (event.field === 'grade') {
      this.updateSectionOptions(event.value);
    }
  }
  
  onStudentAdvancedSearchChange(event: SearchEvent): void {
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query
    };
    this.loadStudentAttendance(filters);
  }
  
  onStudentSearchReset(): void {
    this.updateSectionOptions(null);
    this.studentFilters = {};
    this.loadStudentAttendance();
  }
  
  // ============================================
  // TEACHER TAB HANDLERS
  // ============================================
  
  onTeacherAction(event: { action: string; row: any }): void {
    console.log('onTeacherAction called:', event);
    
    // Handle 'add' action (no row needed)
    if (event.action === 'add') {
      this.markTeacherAttendance();
      return;
    }
    
    const attendance = event.row as TeacherAttendance;
    
    switch (event.action) {
      case 'View Details':
        this.viewAttendance(attendance, 'teacher');
        break;
      case 'Edit':
        this.editAttendance(attendance, 'teacher');
        break;
      case 'Delete':
        this.deleteAttendance(attendance, 'teacher');
        break;
      case 'Teacher Report':
        this.viewTeacherReport(attendance);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }
  
  onTeacherRowClick(row: TeacherAttendance): void {
    this.viewAttendance(row, 'teacher');
  }
  
  onTeacherSelectionChange(selected: TeacherAttendance[]): void {
    this.selectedTeacherRecords = selected;
  }
  
  onTeacherSearchChange(query: string): void {
    this.loadTeacherAttendance({ search: query });
  }
  
  onTeacherSearchFieldChanged(event: { field: string, value: any }): void {
    // Handle teacher-specific field changes
  }
  
  onTeacherAdvancedSearchChange(event: SearchEvent): void {
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query
    };
    this.loadTeacherAttendance(filters);
  }
  
  onTeacherSearchReset(): void {
    this.teacherFilters = {};
    this.loadTeacherAttendance();
  }
  
  // ============================================
  // COMMON ACTIONS
  // ============================================
  
  onExport(format: string, type: 'student' | 'teacher'): void {
    const count = type === 'student' ? this.selectedStudentRecords.length : this.selectedTeacherRecords.length;
    this.errorHandler.showInfo(`Exporting ${count || 'all'} ${type} records as ${format.toUpperCase()}...`);
  }
  
  viewAttendance(attendance: StudentAttendance | TeacherAttendance, type: 'student' | 'teacher'): void {
    console.log('viewAttendance called:', { attendance, type });
    
    if (!attendance || !attendance.id) {
      console.error('Invalid attendance record:', attendance);
      this.errorHandler.showError('Invalid attendance record');
      return;
    }
    
    console.log('Navigating to:', `/attendance/view/${attendance.id}`, 'with type:', type);
    
    this.router.navigate(['/attendance/view', attendance.id], { 
      queryParams: { type, returnTab: type } 
    }).then(
      success => console.log('Navigation successful:', success),
      error => console.error('Navigation failed:', error)
    );
  }
  
  editAttendance(attendance: StudentAttendance | TeacherAttendance, type: 'student' | 'teacher'): void {
    console.log('editAttendance called:', { attendance, type });
    
    if (!attendance || !attendance.id) {
      console.error('Invalid attendance record:', attendance);
      this.errorHandler.showError('Invalid attendance record');
      return;
    }
    
    console.log('Navigating to:', `/attendance/edit/${attendance.id}`, 'with type:', type);
    
    this.router.navigate(['/attendance/edit', attendance.id], { 
      queryParams: { type, returnTab: type } 
    }).then(
      success => console.log('Navigation successful:', success),
      error => console.error('Navigation failed:', error)
    );
  }
  
  deleteAttendance(attendance: StudentAttendance | TeacherAttendance, type: 'student' | 'teacher'): void {
    console.log('deleteAttendance called:', { attendance, type });
    
    if (!attendance || !attendance.id) {
      console.error('Invalid attendance record:', attendance);
      this.errorHandler.showError('Invalid attendance record');
      return;
    }
    
    if (confirm(`Are you sure you want to delete this ${type} attendance record for ${attendance.first_name} ${attendance.last_name}?`)) {
      this.errorHandler.showInfo('Delete functionality will be implemented with backend integration');
      // TODO: Implement delete
      // this.attendanceService.deleteAttendance(attendance.id).subscribe({
      //   next: () => {
      //     this.errorHandler.showSuccess('Attendance deleted successfully');
      //     if (type === 'student') {
      //       this.loadStudentAttendance();
      //     } else {
      //       this.loadTeacherAttendance();
      //     }
      //   },
      //   error: (error) => this.errorHandler.showError(error)
      // });
    }
  }
  
  viewStudentReport(attendance: StudentAttendance): void {
    console.log('viewStudentReport called:', attendance);
    
    if ('student_id' in attendance && attendance.student_id) {
      console.log('Navigating to student report:', attendance.student_id);
      
      this.router.navigate(['/attendance/view', attendance.student_id], { 
        queryParams: { report: 'true', type: 'student' } 
      }).then(
        success => console.log('Navigation to student report successful:', success),
        error => console.error('Navigation to student report failed:', error)
      );
    } else {
      console.error('Invalid student attendance record - no student_id:', attendance);
      this.errorHandler.showError('Invalid student attendance record');
    }
  }
  
  viewTeacherReport(attendance: TeacherAttendance): void {
    console.log('viewTeacherReport called:', attendance);
    
    if ('teacher_id' in attendance && attendance.teacher_id) {
      console.log('Navigating to teacher report:', attendance.teacher_id);
      
      this.router.navigate(['/attendance/view', attendance.teacher_id], { 
        queryParams: { report: 'true', type: 'teacher' } 
      }).then(
        success => console.log('Navigation to teacher report successful:', success),
        error => console.error('Navigation to teacher report failed:', error)
      );
    } else {
      console.error('Invalid teacher attendance record - no teacher_id:', attendance);
      this.errorHandler.showError('Invalid teacher attendance record');
    }
  }
  
  /**
   * Navigate to mark student attendance page
   */
  markStudentAttendance(): void {
    console.log('markStudentAttendance called');
    this.router.navigate(['/attendance/mark'], { 
      queryParams: { type: 'student', returnTab: 'student' } 
    }).then(
      success => console.log('Navigation to mark student attendance successful:', success),
      error => console.error('Navigation to mark student attendance failed:', error)
    );
  }
  
  /**
   * Navigate to mark teacher attendance page
   */
  markTeacherAttendance(): void {
    console.log('markTeacherAttendance called');
    this.router.navigate(['/attendance/mark'], { 
      queryParams: { type: 'teacher', returnTab: 'teacher' } 
    }).then(
      success => console.log('Navigation to mark teacher attendance successful:', success),
      error => console.error('Navigation to mark teacher attendance failed:', error)
    );
  }
}

