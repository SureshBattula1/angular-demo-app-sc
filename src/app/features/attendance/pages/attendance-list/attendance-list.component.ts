import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AttendanceService } from '../../services/attendance.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ExportService } from '../../../../shared/services/export.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { StudentAttendance, TeacherAttendance } from '../../../../core/models/attendance.model';
import { Section } from '../../../../core/models/section.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    DataTableComponent,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    MatTableModule
  ],
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.scss']
})
export class AttendanceListComponent implements OnInit {
  @ViewChild('studentDataTable') studentDataTable!: DataTableComponent;
  @ViewChild('teacherDataTable') teacherDataTable!: DataTableComponent;

  loading = false;
  activeTab: 'dashboard' | 'student' | 'teacher' = 'dashboard'; // Default to dashboard
  loadedTabs = new Set<string>(['dashboard']); // Track which tabs have been loaded for lazy loading

  // Dashboard data
  teacherAttendanceDashboard: any = null;
  studentAttendanceDashboard: any = null;

  // Separate data arrays for each tab
  studentRecords: StudentAttendance[] = [];
  teacherRecords: TeacherAttendance[] = [];
  selectedRecords: (StudentAttendance | TeacherAttendance)[] = [];

  // Counts for tab badges
  studentCount = 0;
  teacherCount = 0;

  // Current filters
  currentFilters: Record<string, unknown> = {};
  dashboardFilters: Record<string, unknown> = {};
  branches: any[] = [];
  grades: any[] = [];
  allSections: Section[] = [];
  sections: any[] = [];
  private selectedBranchIdForStudentSearch: string | number | null = null;
  selectedBranch: string | number | null = null;

  // Date range filters for dashboard
  selectedPeriod = new FormControl('today');
  customFromDate = new FormControl();
  customToDate = new FormControl();

  // Selected branch / grade / section for "Grade & Section — Student Attendance" (cascade)
  selectedBranchForStudentClass: string | number | null = null;
  selectedGrade: string | null = null;
  selectedSection: string | null = null;
  selectedStatus: string | null = null; // Status filter for student attendance
  studentAttendanceByClassSection: any = null;

  // Attendance status options
  attendanceStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'Present', label: 'Present' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Late', label: 'Late' },
    { value: 'Leave', label: 'Leave' },
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Half-Day', label: 'Half-Day' }
  ];

  // Branch-wise teacher attendance
  selectedBranchForTeachers: string | number | null = null;
  selectedStatusForTeachers: string | null = null; // Status filter for teacher attendance
  teacherAttendanceByBranch: any = null;

  // Separate table configurations
  studentTableConfig: TableConfig = {
    columns: this.getStudentColumns(),
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewAttendance(row), permission: 'student_attendance.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editAttendance(row), permission: 'student_attendance.edit' },
      // Delete intentionally omitted: the backend disallows attendance deletion (re-mark/edit instead).
      { icon: 'assessment', label: 'Student Report', color: 'accent', action: (row) => this.viewStudentReport(row), permission: 'student_attendance.report' }
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
    defaultPageSize: 25,
    addButtonPermission: 'student_attendance.create'
  };

  teacherTableConfig: TableConfig = {
    columns: this.getTeacherColumns(),
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewAttendance(row), permission: 'teacher_attendance.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editAttendance(row), permission: 'teacher_attendance.edit' },
      // Delete intentionally omitted: the backend disallows attendance deletion (re-mark/edit instead).
      { icon: 'assessment', label: 'Teacher Report', color: 'accent', action: (row) => this.viewTeacherReport(row), permission: 'teacher_attendance.report' }
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
    defaultPageSize: 25,
    addButtonPermission: 'teacher_attendance.create'
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
        options: []
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

  constructor(
    private attendanceService: AttendanceService,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService,
    private router: Router,
    private route: ActivatedRoute,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private departmentService: DepartmentService
  ) { }

  ngOnInit(): void {
    // Check query parameters to restore active tab
    this.route.queryParams.subscribe(params => {
      // Check both 'tab' and 'returnTab' params to restore correct tab
      const tabType = params['tab'] || params['returnTab'];
      if (tabType === 'dashboard') {
        this.activeTab = 'dashboard';
        this.loadedTabs.add('dashboard');
      } else if (tabType === 'teacher') {
        this.activeTab = 'teacher';
        this.loadedTabs.add('teacher');
      } else if (tabType === 'student') {
        this.activeTab = 'student';
        this.loadedTabs.add('student');
      } else {
        this.activeTab = 'dashboard'; // Default to dashboard
        this.loadedTabs.add('dashboard');
      }
    });

    // Load filter options (grades load after branches resolve — see loadBranches)
    this.loadBranches();
    this.loadDepartments();

    // Only load data for the active tab (lazy loading)
    this.loadActiveTabData();

    // Listen to period changes for dashboard
    this.selectedPeriod.valueChanges.subscribe(() => {
      if (this.activeTab === 'dashboard') {
        this.loadDashboardData();
        // Reload branch-wise teacher attendance if branch is selected
        if (this.selectedBranchForTeachers) {
          this.loadTeacherAttendanceByBranch();
        }
        // Reload student attendance by class/section if branch, grade and section are selected
        if (
          this.selectedBranchForStudentClass &&
          this.selectedGrade &&
          this.selectedSection
        ) {
          this.loadStudentAttendanceByClassSection();
        }
      }
    });
  }

  // Load data for active tab
  private loadActiveTabData(): void {
    if (this.activeTab === 'dashboard') {
      this.loadDashboardData();
    } else if (this.activeTab === 'student') {
      this.loadStudentAttendance();
    } else {
      this.loadTeacherAttendance();
    }
  }

  /**
   * Tab switching with lazy loading
   * Only load data when user clicks on a tab for the first time
   */
  switchTab(tab: 'dashboard' | 'student' | 'teacher'): void {
    this.activeTab = tab;

    // Mark tab as loaded for lazy loading
    this.loadedTabs.add(tab);

    // Update URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });

    // Load data for the tab
    this.loadActiveTabData();
  }

  /**
   * Check if a tab has been loaded (for lazy loading in template)
   */
  isTabLoaded(tab: string): boolean {
    return this.loadedTabs.has(tab);
  }

  // Load dashboard data
  loadDashboardData(filters: Record<string, any> = {}): void {
    this.loading = true;

    // Build filters with date range
    const dateFilters: Record<string, any> = {
      period: this.selectedPeriod.value || 'today'
    };

    // Add custom date range if selected
    if (this.selectedPeriod.value === 'custom') {
      if (this.customFromDate.value) {
        dateFilters['from_date'] = this.formatDate(this.customFromDate.value);
      }
      if (this.customToDate.value) {
        dateFilters['to_date'] = this.formatDate(this.customToDate.value);
      }
    }

    // Merge with existing filters
    this.dashboardFilters = { ...this.dashboardFilters, ...filters, ...dateFilters };

    // Load both teacher and student dashboard data in parallel
    const teacherFilters = { ...this.dashboardFilters, type: 'teacher' };
    const studentFilters = { ...this.dashboardFilters, type: 'student' };

    forkJoin({
      teacher: this.attendanceService.getTodayAttendance(teacherFilters),
      student: this.attendanceService.getTodayAttendance(studentFilters)
    }).subscribe({
      next: (responses) => {
        // Handle teacher response
        if (responses.teacher.success && responses.teacher.data) {
          // The API returns { success: true, data: { summary: {...}, by_status: [...], ... } }
          this.teacherAttendanceDashboard = responses.teacher.data;
        } else {
          this.teacherAttendanceDashboard = null;
        }

        // Handle student response
        if (responses.student.success && responses.student.data) {
          // The API returns { success: true, data: { summary: {...}, by_status: [...], ... } }
          this.studentAttendanceDashboard = responses.student.data;
        } else {
          this.studentAttendanceDashboard = null;
        }

        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.teacherAttendanceDashboard = null;
        this.studentAttendanceDashboard = null;
        this.loading = false;
      }
    });
  }

  onBranchFilterChange(): void {
    const filters: Record<string, any> = {};
    if (this.selectedBranch) {
      filters['branch_id'] = this.selectedBranch;
    }

    if (this.activeTab === 'dashboard') {
      this.loadDashboardData(filters);
    } else if (this.activeTab === 'student') {
      this.loadStudentAttendance(filters);
    } else {
      this.loadTeacherAttendance(filters);
    }
  }

  /** Grades for "Grade & Section — Student Attendance" — only for the selected branch. */
  private loadGradesForStudentClassSection(): void {
    if (
      this.selectedBranchForStudentClass === null ||
      this.selectedBranchForStudentClass === undefined ||
      this.selectedBranchForStudentClass === ''
    ) {
      this.grades = [];
      return;
    }
    const params: Record<string, unknown> = {
      is_active: true,
      per_page: 100,
      branch_id: this.selectedBranchForStudentClass
    };
    this.gradeService.getGrades(params).subscribe({
      next: (response) => {
        const raw = response.success && response.data ? response.data : [];
        const list = Array.isArray(raw) ? raw : [];
        this.grades = list.filter((g: { is_active?: boolean }) => g.is_active !== false);
      },
      error: () => {
        this.grades = [];
      }
    });
  }

  onBranchForStudentClassChange(): void {
    this.selectedGrade = null;
    this.selectedSection = null;
    this.sections = [];
    this.studentAttendanceByClassSection = null;
    this.loadGradesForStudentClassSection();
  }

  onCustomRangeChange(): void {
    if (this.customFromDate.value && this.customToDate.value) {
      if (this.activeTab === 'dashboard') {
        this.loadDashboardData();
        // Reload branch-wise teacher attendance if branch is selected
        if (this.selectedBranchForTeachers) {
          this.loadTeacherAttendanceByBranch();
        }
        // Reload student attendance by class/section if grade and section are selected
        if (
          this.selectedBranchForStudentClass &&
          this.selectedGrade &&
          this.selectedSection
        ) {
          this.loadStudentAttendanceByClassSection();
        }
      }
    }
  }

  onGradeChange(): void {
    if (this.selectedGrade && this.selectedBranchForStudentClass) {
      this.loadSectionsForDashboard();
    } else {
      this.sections = [];
      this.selectedSection = null;
    }
  }

  onSectionChange(): void {
    if (
      this.selectedBranchForStudentClass &&
      this.selectedGrade &&
      this.selectedSection
    ) {
      this.loadStudentAttendanceByClassSection();
    }
  }

  onStatusChange(): void {
    if (
      this.selectedBranchForStudentClass &&
      this.selectedGrade &&
      this.selectedSection
    ) {
      this.loadStudentAttendanceByClassSection();
    }
  }

  loadStudentAttendanceByClassSection(): void {
    if (
      !this.selectedBranchForStudentClass ||
      !this.selectedGrade ||
      !this.selectedSection
    ) {
      return;
    }

    this.loading = true;

    const filters: Record<string, any> = {
      grade: this.selectedGrade,
      section: this.selectedSection,
      period: this.selectedPeriod.value || 'today',
      type: 'student'
    };

    // Add custom date range if selected
    if (this.selectedPeriod.value === 'custom') {
      if (this.customFromDate.value) {
        filters['from_date'] = this.formatDate(this.customFromDate.value);
      }
      if (this.customToDate.value) {
        filters['to_date'] = this.formatDate(this.customToDate.value);
      }
    }

    filters['branch_id'] = this.selectedBranchForStudentClass;

    // Add status filter if selected (optional - only if a specific status is chosen)
    if (this.selectedStatus) {
      filters['status'] = this.selectedStatus;
    }

    this.attendanceService.getTodayAttendance(filters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.studentAttendanceByClassSection = response.data;
        } else {
          this.studentAttendanceByClassSection = null;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.studentAttendanceByClassSection = null;
        this.loading = false;
      }
    });
  }

  loadSectionsForDashboard(): void {
    if (!this.selectedGrade) {
      this.sections = [];
      return;
    }

    const filters: any = {
      grade_level: this.selectedGrade,
      is_active: true,
      per_page: 1000
    };

    if (this.selectedBranchForStudentClass) {
      filters.branch_id = this.selectedBranchForStudentClass;
    }

    this.sectionService.getSections(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sections = response.data;
        } else {
          this.sections = [];
        }
      },
      error: (error) => {
        this.sections = [];
      }
    });
  }

  // Format date for API
  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get grade label
  getGradeLabel(gradeValue: string): string {
    const grade = this.grades.find(g => g.value === gradeValue);
    return grade ? grade.label : `Grade ${gradeValue}`;
  }

  // Get branch name
  getBranchName(branchId: string | number): string {
    const branch = this.branches.find(b => b.id === branchId);
    return branch ? branch.name : `Branch ${branchId}`;
  }

  /** Rows for grade/section dashboard table (aggregated students API). */
  getStudentClassRows(): any[] {
    const d = this.studentAttendanceByClassSection;
    if (!d) return [];
    return d.students ?? d.data ?? [];
  }

  // Load branch-wise teacher attendance
  loadTeacherAttendanceByBranch(): void {
    this.loading = true;

    const branchId = this.selectedBranchForTeachers;

    const filters: Record<string, any> = {
      period: this.selectedPeriod.value || 'today',
      type: 'teacher',
      return_teachers: true // Request teacher list instead of breakdowns
    };

    // When user selects "All Branches", value becomes "" (falsy). In that case
    // we omit branch_id so backend returns teachers across all accessible branches.
    if (branchId !== null && branchId !== undefined && branchId !== '') {
      filters['branch_id'] = branchId;
    }

    // Add custom date range if selected
    if (this.selectedPeriod.value === 'custom') {
      if (this.customFromDate.value) {
        filters['from_date'] = this.formatDate(this.customFromDate.value);
      }
      if (this.customToDate.value) {
        filters['to_date'] = this.formatDate(this.customToDate.value);
      }
    }

    // Add status filter if selected (optional - only if a specific status is chosen)
    if (this.selectedStatusForTeachers) {
      filters['status'] = this.selectedStatusForTeachers;
    }

    this.attendanceService.getTodayAttendance(filters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.teacherAttendanceByBranch = response.data;
        } else {
          this.teacherAttendanceByBranch = null;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.teacherAttendanceByBranch = null;
        this.loading = false;
      }
    });
  }

  onBranchForTeachersChange(): void {
    this.loadTeacherAttendanceByBranch();
  }

  onStatusForTeachersChange(): void {
    if (this.selectedBranchForTeachers) {
      this.loadTeacherAttendanceByBranch();
    }
  }

  // Load student attendance
  loadStudentAttendance(filters: Record<string, any> = {}): void {
    this.loading = true;
    const params = { ...filters, type: 'student' as const };

    this.attendanceService.getAttendance(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.studentRecords = (response.data || []).map((record: StudentAttendance) => ({
            ...record,
            full_name: record.full_name || `${record.first_name || ''} ${record.last_name || ''}`.trim()
          }));
          if (response.meta) {
            this.studentTableConfig = { ...this.studentTableConfig, totalCount: response.meta.total };
            this.studentCount = response.meta.total;
          } else {
            this.studentCount = this.studentRecords.length;
            this.studentTableConfig = { ...this.studentTableConfig, totalCount: this.studentRecords.length };
          }
        } else {
          this.studentRecords = [];
          this.studentCount = 0;
          this.studentTableConfig = { ...this.studentTableConfig, totalCount: 0 };
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.studentRecords = [];
        this.studentCount = 0;
        this.studentTableConfig = { ...this.studentTableConfig, totalCount: 0 };
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
          this.teacherRecords = (response.data || []).map((record: TeacherAttendance) => ({
            ...record,
            full_name: record.full_name || `${record.first_name || ''} ${record.last_name || ''}`.trim()
          }));
          if (response.meta) {
            this.teacherTableConfig = { ...this.teacherTableConfig, totalCount: response.meta.total };
            this.teacherCount = response.meta.total;
          } else {
            this.teacherCount = this.teacherRecords.length;
            this.teacherTableConfig = { ...this.teacherTableConfig, totalCount: this.teacherRecords.length };
          }
        } else {
          this.teacherRecords = [];
          this.teacherCount = 0;
          this.teacherTableConfig = { ...this.teacherTableConfig, totalCount: 0 };
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.teacherRecords = [];
        this.teacherCount = 0;
        this.teacherTableConfig = { ...this.teacherTableConfig, totalCount: 0 };
        this.loading = false;
      }
    });
  }

  getStudentColumns(): TableColumn[] {
    return [
      { key: 'date', header: 'Date', sortable: true, searchable: true, width: '120px' },
      { key: 'full_name', header: 'Full Name', sortable: true, searchable: true },
      { key: 'admission_number', header: 'Admission No.', searchable: true, width: '140px' },
      { key: 'branch_name', header: 'Branch', sortable: true, searchable: true, width: '160px' },
      { key: 'grade_label', header: 'Grade', sortable: true, width: '120px' },
      { key: 'section', header: 'Section', sortable: true, width: '100px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'remarks', header: 'Remarks', width: '200px' }
    ];
  }

  getTeacherColumns(): TableColumn[] {
    return [
      { key: 'date', header: 'Date', sortable: true, searchable: true, width: '120px' },
      { key: 'full_name', header: 'Full Name', sortable: true, searchable: true },
      { key: 'employee_id', header: 'Employee ID', searchable: true, width: '140px' },
      { key: 'email', header: 'Email', searchable: true, width: '200px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'remarks', header: 'Remarks', width: '200px' }
    ];
  }

  /**
   * Set student grade options (advanced search)
   */
  private setStudentGradeOptions(options: Array<{ value: any; label: string; disabled?: boolean }>): void {
    const studentGradeField = this.studentSearchConfig.fields.find(f => f.key === 'grade');
    if (studentGradeField) studentGradeField.options = options;
  }

  /**
   * Set student section options (advanced search)
   */
  private setStudentSectionOptions(options: Array<{ value: any; label: string; disabled?: boolean }>): void {
    const studentSectionField = this.studentSearchConfig.fields.find(f => f.key === 'section');
    if (studentSectionField) studentSectionField.options = options;
  }

  /**
   * Load grades for selected branch (cascade: branch -> grade)
   */
  private loadGradesForBranch(branchId: string | number): void {
    this.setStudentGradeOptions([{ value: '', label: 'Loading grades...', disabled: true }]);
    // branchId may be an opaque hashid string when HASHIDS_ENABLED is on; never Number() it (→ NaN).
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const gradeOptions = response.data
            .filter((g: any) => g.is_active)
            .map((g: any) => ({ value: g.value, label: g.label }));
          this.setStudentGradeOptions(gradeOptions);
          return;
        }
        this.setStudentGradeOptions([]);
      },
      error: (error) => {
        this.setStudentGradeOptions([]);
      }
    });
  }

  /**
   * Load sections for selected branch + grade (cascade: grade -> section)
   */
  private loadSectionsForBranchAndGrade(branchId: string | number, grade: string): void {
    this.setStudentSectionOptions([{ value: '', label: 'Loading sections...', disabled: true }]);
    this.sectionService.getSections({ branch_id: branchId, grade_level: grade, per_page: 1000, is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const sectionOptions = response.data
            .filter((s: any) => s.is_active)
            .map((s: any) => ({ value: s.name, label: `${s.name}${s.code ? ' (' + s.code + ')' : ''}` }));
          this.setStudentSectionOptions(sectionOptions);
          return;
        }
        this.setStudentSectionOptions([]);
      },
      error: () => {
        this.setStudentSectionOptions([]);
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

          const studentBranchField = this.studentSearchConfig.fields.find(f => f.key === 'branch_id');
          if (studentBranchField) {
            studentBranchField.options = branchOptions;
          }

          const teacherBranchField = this.teacherSearchConfig.fields.find(f => f.key === 'branch_id');
          if (teacherBranchField) {
            teacherBranchField.options = branchOptions;
          }

          if (this.selectedBranchForStudentClass) {
            this.loadGradesForStudentClassSection();
          } else {
            this.grades = [];
          }
        }
      },
      error: (error: any) => {
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

          const teacherDeptField = this.teacherSearchConfig.fields.find(f => f.key === 'department');
          if (teacherDeptField) {
            teacherDeptField.options = departmentOptions;
          }
        }
      },
      error: (error) => {
      }
    });
  }

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
    }
  }

  onRowClick(row: StudentAttendance | TeacherAttendance): void {
    this.viewAttendance(row);
  }

  onSelectionChange(selected: (StudentAttendance | TeacherAttendance)[]): void {
    this.selectedRecords = selected;
  }

  onExport(format: string): void {
    const type = this.activeTab;
    const recordCount = this.selectedRecords.length || (type === 'student' ? this.studentCount : this.teacherCount);

    this.errorHandler.showInfo(`Exporting ${recordCount} ${type} attendance records as ${format.toUpperCase()}...`);

    const exportConfig = {
      endpoint: '/attendance/export',
      filename: `${type}_attendance_export`
    };

    const exportOptions = {
      format: format as 'excel' | 'pdf' | 'csv',
      filters: {
        ...this.currentFilters,
        type: type
      }
    };

    this.exportService.export(exportConfig, exportOptions);
  }

  onSearchChange(query: string): void {
    if (this.activeTab === 'student') {
      this.loadStudentAttendance({ search: query });
    } else {
      this.loadTeacherAttendance({ search: query });
    }
  }

  onSearchFieldChanged(event: { field: string, value: any }): void {
    // Student advanced search cascade
    if (event.field === 'branch_id') {
      this.selectedBranchIdForStudentSearch = event.value || null;
      this.setStudentSectionOptions([]);
      if (this.selectedBranchIdForStudentSearch) {
        this.loadGradesForBranch(this.selectedBranchIdForStudentSearch);
      } else {
        this.setStudentGradeOptions([]);
        this.setStudentSectionOptions([]);
      }
    }

    if (event.field === 'grade') {
      const grade = event.value;
      this.setStudentSectionOptions([]);
      if (this.selectedBranchIdForStudentSearch && grade) {
        this.loadSectionsForBranchAndGrade(this.selectedBranchIdForStudentSearch, String(grade));
      }
    }
  }

  /**
   * Handle pagination changes
   */
  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };

    if (this.activeTab === 'student') {
      this.loadStudentAttendance(this.currentFilters);
    } else {
      this.loadTeacherAttendance(this.currentFilters);
    }
  }

  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    const columnMapping: Record<string, string> = {
      'date': this.activeTab === 'student' ? 'student_attendance.date' : 'teacher_attendance.date',
      'first_name': 'users.first_name',
      'last_name': 'users.last_name',
      'admission_number': 'students.admission_number',
      'grade_label': 'students.grade',
      'section': 'students.section',
      'status': this.activeTab === 'student' ? 'student_attendance.status' : 'teacher_attendance.status',
      'employee_id': 'teachers.employee_id'
    };

    const sortColumn = columnMapping[event.field] || event.field;

    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_direction: event.direction
    };

    if (this.activeTab === 'student') {
      this.loadStudentAttendance(this.currentFilters);
    } else {
      this.loadTeacherAttendance(this.currentFilters);
    }
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query,
      page: 1
    };

    this.currentFilters = filters;

    if (this.activeTab === 'student') {
      this.loadStudentAttendance(filters);
    } else {
      this.loadTeacherAttendance(filters);
    }
  }

  onSearchReset(): void {
    this.selectedBranchIdForStudentSearch = null;
    this.setStudentGradeOptions([]);
    this.setStudentSectionOptions([]);

    if (this.activeTab === 'student') {
      this.loadStudentAttendance();
    } else {
      this.loadTeacherAttendance();
    }
  }

  viewAttendance(attendance: StudentAttendance | TeacherAttendance): void {
    // Preserve the current tab when navigating away
    this.router.navigate(['/attendance/view', attendance.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }

  editAttendance(attendance: StudentAttendance | TeacherAttendance): void {
    // Preserve the current tab when navigating away
    this.router.navigate(['/attendance/edit', attendance.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }

  deleteAttendance(attendance: StudentAttendance | TeacherAttendance): void {
    if (confirm(`Are you sure you want to delete this attendance record for ${attendance.first_name} ${attendance.last_name}?`)) {
      this.errorHandler.showInfo('Delete functionality will be implemented with backend integration');
    }
  }

  viewStudentReport(attendance: StudentAttendance | TeacherAttendance): void {
    if ('student_id' in attendance) {
      this.router.navigate(['/attendance/view', attendance.student_id], {
        queryParams: { report: 'true', type: 'student', returnTab: this.activeTab }
      });
    }
  }

  viewTeacherReport(attendance: StudentAttendance | TeacherAttendance): void {
    if ('teacher_id' in attendance) {
      this.router.navigate(['/attendance/view', attendance.teacher_id], {
        queryParams: { report: 'true', type: 'teacher', returnTab: this.activeTab }
      });
    }
  }

  markStudentAttendance(): void {
    this.router.navigate(['/attendance/mark'], {
      queryParams: { type: 'student' }
    });
  }

  markTeacherAttendance(): void {
    this.router.navigate(['/attendance/mark'], {
      queryParams: { type: 'teacher' }
    });
  }
}
