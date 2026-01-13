import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.scss']
})
export class AttendanceListComponent implements OnInit {
  @ViewChild('studentDataTable') studentDataTable!: DataTableComponent;
  @ViewChild('teacherDataTable') teacherDataTable!: DataTableComponent;
  
  loading = false;
  activeTab: 'student' | 'teacher' = 'student';
  loadedTabs = new Set<string>(['student']); // Track which tabs have been loaded for lazy loading
  
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
  currentGrade: string | null = null; // Track current grade selection
  currentBranch: string | null = null; // Track current branch selection
  
  // Separate table configurations
  studentTableConfig: TableConfig = {
    columns: this.getStudentColumns(),
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewAttendance(row), permission: 'student_attendance.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editAttendance(row), permission: 'student_attendance.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteAttendance(row), permission: 'student_attendance.delete' },
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
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteAttendance(row), permission: 'teacher_attendance.delete' },
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
  ) {}
  
  ngOnInit(): void {
    // Check query parameters to restore active tab
    this.route.queryParams.subscribe(params => {
      // Check both 'tab' and 'returnTab' params to restore correct tab
      const tabType = params['tab'] || params['returnTab'];
      if (tabType === 'teacher') {
        this.activeTab = 'teacher';
        this.loadedTabs.add('teacher');
      } else {
        this.activeTab = 'student';
        this.loadedTabs.add('student');
      }
    });
    
    // Load filter options
    this.loadBranches();
    this.loadGrades();
    this.loadSections();
    this.loadDepartments();
    
    // Only load data for the active tab (lazy loading)
    if (this.activeTab === 'student') {
      this.loadStudentAttendance();
    } else {
      this.loadTeacherAttendance();
    }
  }

  /**
   * Tab switching with lazy loading
   * Only load data when user clicks on a tab for the first time
   */
  switchTab(tab: 'student' | 'teacher'): void {
    this.activeTab = tab;
    
    // Lazy load data only if not already loaded
    if (!this.loadedTabs.has(tab)) {
      this.loadedTabs.add(tab);
      
      if (tab === 'student') {
        this.loadStudentAttendance();
      } else {
        this.loadTeacherAttendance();
      }
    }
    
    // Update URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Check if a tab has been loaded (for lazy loading in template)
   */
  isTabLoaded(tab: string): boolean {
    return this.loadedTabs.has(tab);
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
   * Load all sections for filtering
   */
  loadSections(): void {
    this.sectionService.getSections({ per_page: 1000, is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allSections = response.data;
          this.updateSectionOptions(null, null);
        }
      },
      error: (error) => {
      }
    });
  }
  
  /**
   * Update section options based on selected grade and branch
   */
  updateSectionOptions(selectedGrade: string | null, selectedBranch: string | null = null): void {
    let filteredSections = this.allSections;
    
    // Filter by grade if selected
    if (selectedGrade) {
      filteredSections = filteredSections.filter(
        section => String(section.grade_level) === String(selectedGrade)
      );
    }
    
    // Filter by branch if selected
    if (selectedBranch) {
      filteredSections = filteredSections.filter(
        section => Number(section.branch_id) === Number(selectedBranch)
      );
    }
    
    // Only show active sections
    filteredSections = filteredSections.filter(section => section.is_active);
    
    const sectionOptions = filteredSections.map(section => ({
      value: section.name,
      label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
    }));
    
    const studentSectionField = this.studentSearchConfig.fields.find(f => f.key === 'section');
    if (studentSectionField) {
      studentSectionField.options = sectionOptions;
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
          
          const studentGradeField = this.studentSearchConfig.fields.find(f => f.key === 'grade');
          if (studentGradeField) {
            studentGradeField.options = gradeOptions;
          }
        }
      },
      error: (error) => {
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
    // Update sections when grade or branch field changes
    if (event.field === 'grade') {
      this.currentGrade = event.value;
      this.updateSectionOptions(this.currentGrade, this.currentBranch);
    } else if (event.field === 'branch_id') {
      this.currentBranch = event.value;
      this.updateSectionOptions(this.currentGrade, this.currentBranch);
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
    this.updateSectionOptions(null);
    
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
