import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { LeaveService } from '../../services/leave.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { AcademicYearService } from '../../../settings/services/academic-year.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentLeave, TeacherLeave } from '../../../../core/models/leave.model';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-leave-list',
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
              Student Leaves
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
              Teacher Leaves
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
              [title]="'Student Leaves'"
              [loading]="loading"
              (actionClicked)="onStudentAction($event)"
              (rowClicked)="onRowClick($event)"
              (selectionChanged)="onSelectionChange($event)"
              (paginationChanged)="onPaginationChange($event)"
              (sortChanged)="onSortChange($event)"
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
              [title]="'Teacher Leaves'"
              [loading]="loading"
              (actionClicked)="onTeacherAction($event)"
              (rowClicked)="onRowClick($event)"
              (selectionChanged)="onSelectionChange($event)"
              (paginationChanged)="onPaginationChange($event)"
              (sortChanged)="onSortChange($event)"
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
    .page-container { max-width: 1600px; margin: 0 auto; padding: 20px; }
    
    /* Tabs Container */
    .tabs-container {
      background: var(--card-background);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    /* Tab Header */
    .tabs-header {
      display: flex;
      border-bottom: 2px solid var(--border-color);
      background: var(--background-color);
    }
    
    .tab-item {
      flex: 1;
      padding: 16px 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--text-secondary);
      font-size: 15px;
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .tab-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .tab-item:hover {
      background: var(--hover-background);
      color: var(--primary-color);
    }
    
    .tab-item.active {
      color: var(--primary-color);
      background: var(--card-background);
    }
    
    .tab-item.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--primary-color);
    }
    
    .tab-badge {
      background: var(--primary-color);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      min-width: 24px;
      text-align: center;
    }
    
    .tab-label-short {
      display: none;
    }
    
    /* Tab Content */
    .tabs-content {
      padding: 24px;
    }
    
    .tab-pane {
      display: none;
    }
    
    .tab-pane.active {
      display: block;
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      .page-container {
        padding: 12px;
      }
      
      .tabs-header {
        gap: 0;
      }
      
      .tab-item {
        padding: 12px 8px;
        font-size: 13px;
      }
      
      .tab-label-full {
        display: none;
      }
      
      .tab-label-short {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-direction: column;
      }
      
      .tab-label-short mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      
      .tabs-content {
        padding: 16px;
      }
    }
  `]
})
export class LeaveListComponent implements OnInit, OnDestroy {
  @ViewChild('studentDataTable') studentDataTable!: DataTableComponent;
  @ViewChild('teacherDataTable') teacherDataTable!: DataTableComponent;
  
  loading = false;
  activeTab: 'student' | 'teacher' = 'student';
  
  // Separate data arrays for each tab
  studentRecords: StudentLeave[] = [];
  teacherRecords: TeacherLeave[] = [];
  selectedRecords: (StudentLeave | TeacherLeave)[] = [];
  
  // Counts for tab badges
  studentCount = 0;
  teacherCount = 0;
  
  // Current filters
  currentFilters: Record<string, unknown> = {};
  branches: any[] = [];
  allSections: Section[] = [];
  academicYears: { id: number; name: string }[] = [];
  currentGrade: string | null = null; // Track current grade selection
  currentBranch: string | null = null; // Track current branch selection
  private academicYearSub?: Subscription;
  
  // Separate table configurations
  studentTableConfig: TableConfig = {
    columns: this.getStudentColumns(),
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewLeave(row) },
      { icon: 'check', label: 'Approve', color: 'primary', action: (row) => this.approveLeave(row), show: (row) => row.status === 'Pending' },
      { icon: 'close', label: 'Reject', color: 'warn', action: (row) => this.rejectLeave(row), show: (row) => row.status === 'Pending' },
      { icon: 'edit', label: 'Edit', color: 'accent', action: (row) => this.editLeave(row), show: (row) => row.status === 'Pending' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteLeave(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: false,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25
  };

  teacherTableConfig: TableConfig = {
    columns: this.getTeacherColumns(),
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewLeave(row) },
      { icon: 'check', label: 'Approve', color: 'primary', action: (row) => this.approveLeave(row), show: (row) => row.status === 'Pending' },
      { icon: 'close', label: 'Reject', color: 'warn', action: (row) => this.rejectLeave(row), show: (row) => row.status === 'Pending' },
      { icon: 'edit', label: 'Edit', color: 'accent', action: (row) => this.editLeave(row), show: (row) => row.status === 'Pending' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteLeave(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: false,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25
  };

  // Separate search configurations
  studentSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Student Leave Search',
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
        key: 'academic_year_id',
        label: 'Academic Year',
        type: 'select',
        icon: 'calendar_month',
        options: []
      },
      {
        key: 'from_date',
        label: 'From Date',
        type: 'date',
        icon: 'event',
      },
      {
        key: 'to_date',
        label: 'To Date',
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
          { value: 'Pending', label: 'Pending' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Rejected', label: 'Rejected' },
          { value: 'Cancelled', label: 'Cancelled' }
        ]
      },
      {
        key: 'leave_type',
        label: 'Leave Type',
        type: 'select',
        icon: 'category',
        options: [
          { value: 'Sick Leave', label: 'Sick Leave' },
          { value: 'Casual Leave', label: 'Casual Leave' },
          { value: 'Medical Leave', label: 'Medical Leave' },
          { value: 'Family Emergency', label: 'Family Emergency' },
          { value: 'Other', label: 'Other' }
        ]
      }
    ]
  };

  teacherSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Teacher Leave Search',
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
        key: 'from_date',
        label: 'From Date',
        type: 'date',
        icon: 'event',
      },
      {
        key: 'to_date',
        label: 'To Date',
        type: 'date',
        icon: 'event',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'Pending', label: 'Pending' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Rejected', label: 'Rejected' },
          { value: 'Cancelled', label: 'Cancelled' }
        ]
      },
      {
        key: 'leave_type',
        label: 'Leave Type',
        type: 'select',
        icon: 'category',
        options: [
          { value: 'Sick Leave', label: 'Sick Leave' },
          { value: 'Casual Leave', label: 'Casual Leave' },
          { value: 'Medical Leave', label: 'Medical Leave' },
          { value: 'Maternity Leave', label: 'Maternity Leave' },
          { value: 'Paternity Leave', label: 'Paternity Leave' },
          { value: 'Compensatory Leave', label: 'Compensatory Leave' },
          { value: 'Unpaid Leave', label: 'Unpaid Leave' },
          { value: 'Other', label: 'Other' }
        ]
      }
    ]
  };
  
  constructor(
    private leaveService: LeaveService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private academicYearService: AcademicYearService,
    private academicYearContext: AcademicYearContextService
  ) {}
  
  ngOnInit(): void {
    // Check query parameters to restore active tab
    this.route.queryParams.subscribe(params => {
      const tabType = params['tab'];
      if (tabType === 'teacher') {
        this.activeTab = 'teacher';
      } else {
        this.activeTab = 'student';
      }
    });
    
    this.loadBranches();
    this.loadGrades();
    this.loadSections();
    this.loadAcademicYears();
    this.loadStudentLeaves();
    this.loadTeacherLeaves();
    
    // Reload leaves when toolbar academic year changes
    this.academicYearSub = this.academicYearContext.selectedYearId$.pipe(skip(1)).subscribe(() => {
      this.loadStudentLeaves(this.currentFilters);
      this.loadTeacherLeaves(this.currentFilters);
    });
  }
  
  ngOnDestroy(): void {
    this.academicYearSub?.unsubscribe();
  }

  switchTab(tab: 'student' | 'teacher'): void {
    this.activeTab = tab;
  }

  loadStudentLeaves(filters: Record<string, any> = {}): void {
    this.loading = true;
    const params: Record<string, any> = { ...filters, type: 'student' };
    // Apply toolbar academic year when not overridden by advanced search
    if (params['academic_year_id'] === undefined || params['academic_year_id'] === null || params['academic_year_id'] === '') {
      const selectedYearId = this.academicYearContext.selectedYearId;
      if (selectedYearId != null) {
        params['academic_year_id'] = selectedYearId;
      }
    }
    
    this.leaveService.getLeaves(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.studentRecords = this.processLeaveData(response.data || []);
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

  loadTeacherLeaves(filters: Record<string, any> = {}): void {
    this.loading = true;
    const params: Record<string, any> = { ...filters, type: 'teacher' };
    // Apply toolbar academic year when not overridden by advanced search
    if (params['academic_year_id'] === undefined || params['academic_year_id'] === null || params['academic_year_id'] === '') {
      const selectedYearId = this.academicYearContext.selectedYearId;
      if (selectedYearId != null) {
        params['academic_year_id'] = selectedYearId;
      }
    }
    
    this.leaveService.getLeaves(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.teacherRecords = this.processLeaveData(response.data || []);
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
  
  /**
   * Process leave data to add full_name field
   */
  processLeaveData(leaves: any[]): any[] {
    return leaves.map(leave => ({
      ...leave,
      full_name: [leave.first_name, leave.last_name].filter(Boolean).join(' ').trim() || '-'
    }));
  }
  
  getStudentColumns(): TableColumn[] {
    return [
      { key: 'full_name', header: 'Full Name', sortable: true, searchable: true },
      { key: 'branch_name', header: 'Branch', sortable: true, searchable: true, width: '150px' },
      { key: 'admission_number', header: 'Admission No.', searchable: true, width: '140px' },
      { key: 'grade_label', header: 'Grade', sortable: true, width: '120px' },
      { key: 'section', header: 'Section', sortable: true, width: '100px' },
      { key: 'academic_year_name', header: 'Academic Year', sortable: false, width: '160px' },
      { key: 'from_date', header: 'From Date', sortable: true, width: '120px' },
      { key: 'to_date', header: 'To Date', sortable: true, width: '120px' },
      { key: 'total_days', header: 'Days', sortable: true, width: '80px', align: 'center' },
      { key: 'leave_type', header: 'Leave Type', sortable: true, width: '140px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'reason', header: 'Reason', width: '200px' }
    ];
  }
  
  getTeacherColumns(): TableColumn[] {
    return [
      { key: 'full_name', header: 'Full Name', sortable: true, searchable: true },
      { key: 'branch_name', header: 'Branch', sortable: true, searchable: true, width: '150px' },
      { key: 'employee_id', header: 'Employee ID', searchable: true, width: '140px' },
      { key: 'designation', header: 'Designation', width: '150px' },
      { key: 'from_date', header: 'From Date', sortable: true, width: '120px' },
      { key: 'to_date', header: 'To Date', sortable: true, width: '120px' },
      { key: 'total_days', header: 'Days', sortable: true, width: '80px', align: 'center' },
      { key: 'leave_type', header: 'Leave Type', sortable: true, width: '140px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'reason', header: 'Reason', width: '200px' }
    ];
  }
  
  loadSections(): void {
    this.sectionService.getSections({ per_page: 1000, is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allSections = response.data;
          this.updateSectionOptions(null, null);
        }
      },
      error: (error) => {
        console.error('Error loading sections:', error);
      }
    });
  }
  
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
        section => String(section.branch_id) === String(selectedBranch)
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
  
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const gradeOptions = response.data.map((grade: any) => ({
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
        console.error('Error loading grades:', error);
      }
    });
  }

  /** Load grades for the selected branch and set advanced search grade options */
  loadGradesForBranch(branchId: string | number): void {
    // branchId may be an opaque hashid string when HASHIDS_ENABLED is on; never Number() it (→ NaN).
    const id = branchId === null || branchId === undefined ? undefined : branchId;
    this.gradeService.getGrades(id != null ? { branch_id: id } : undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const gradeOptions = (response.data as any[]).map((grade: any) => ({
            value: grade.value,
            label: grade.label
          }));
          const studentGradeField = this.studentSearchConfig.fields.find(f => f.key === 'grade');
          if (studentGradeField) {
            studentGradeField.options = gradeOptions;
          }
        }
      },
      error: () => {
        const studentGradeField = this.studentSearchConfig.fields.find(f => f.key === 'grade');
        if (studentGradeField) studentGradeField.options = [];
      }
    });
  }

  /** Load sections for the selected branch + grade and set advanced search section options */
  loadSectionsForBranchAndGrade(branchId: string | number | null, grade: string): void {
    if (!branchId || !grade) {
      this.setSectionOptionsForAdvancedSearch([]);
      return;
    }
    this.sectionService.getSections({
      branch_id: branchId,
      grade_level: grade,
      per_page: 1000,
      is_active: true
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const sectionOptions = (response.data as any[]).map((section: any) => ({
            value: section.name,
            label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
          }));
          this.setSectionOptionsForAdvancedSearch(sectionOptions);
        } else {
          this.setSectionOptionsForAdvancedSearch([]);
        }
      },
      error: () => this.setSectionOptionsForAdvancedSearch([])
    });
  }

  /** Set section dropdown options in student advanced search config */
  setSectionOptionsForAdvancedSearch(options: { value: string; label: string }[]): void {
    const studentSectionField = this.studentSearchConfig.fields.find(f => f.key === 'section');
    if (studentSectionField) {
      studentSectionField.options = options;
    }
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
        console.error('Error loading branches:', error);
      }
    });
  }

  loadAcademicYears(): void {
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response) => {
        this.academicYears = (response.success && response.data)
          ? response.data.map((y: any) => ({ id: y.id, name: y.name }))
          : [];

        const options = this.academicYears.map((y) => ({
          value: String(y.id),
          label: y.name
        }));

        const studentAcademicField = this.studentSearchConfig.fields.find(f => f.key === 'academic_year_id');
        if (studentAcademicField) {
          studentAcademicField.options = options;
        }
      },
      error: () => {
        this.academicYears = [];
      }
    });
  }
  
  onStudentAction(event: { action: string; row: any }): void {
    const leave = event.row as StudentLeave;
    
    switch (event.action) {
      case 'add':
        this.addStudentLeave();
        break;
      case 'View Details':
        this.viewLeave(leave);
        break;
      case 'Approve':
        this.approveLeave(leave);
        break;
      case 'Reject':
        this.rejectLeave(leave);
        break;
      case 'Edit':
        this.editLeave(leave);
        break;
      case 'Delete':
        this.deleteLeave(leave);
        break;
    }
  }

  onTeacherAction(event: { action: string; row: any }): void {
    const leave = event.row as TeacherLeave;
    
    switch (event.action) {
      case 'add':
        this.addTeacherLeave();
        break;
      case 'View Details':
        this.viewLeave(leave);
        break;
      case 'Approve':
        this.approveLeave(leave);
        break;
      case 'Reject':
        this.rejectLeave(leave);
        break;
      case 'Edit':
        this.editLeave(leave);
        break;
      case 'Delete':
        this.deleteLeave(leave);
        break;
    }
  }
  
  onRowClick(row: StudentLeave | TeacherLeave): void {
    this.viewLeave(row);
  }
  
  onSelectionChange(selected: (StudentLeave | TeacherLeave)[]): void {
    this.selectedRecords = selected;
  }
  
  onSearchChange(query: string): void {
    if (this.activeTab === 'student') {
      this.loadStudentLeaves({ search: query });
    } else {
      this.loadTeacherLeaves({ search: query });
    }
  }
  
  onSearchFieldChanged(event: { field: string, value: any }): void {
    // Branch selected: load grades for that branch and clear section options
    if (event.field === 'branch_id') {
      this.currentBranch = event.value;
      this.currentGrade = null;
      if (event.value) {
        this.loadGradesForBranch(event.value);
      } else {
        this.loadGrades(); // no branch: show all grades
      }
      this.setSectionOptionsForAdvancedSearch([]);
    }
    // Grade selected: load sections for that branch + grade
    else if (event.field === 'grade') {
      this.currentGrade = event.value;
      if (this.currentBranch && event.value) {
        this.loadSectionsForBranchAndGrade(this.currentBranch, event.value);
      } else if (event.value) {
        this.updateSectionOptions(event.value, this.currentBranch);
      } else {
        this.setSectionOptionsForAdvancedSearch([]);
      }
    }
  }
  
  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };
    
    if (this.activeTab === 'student') {
      this.loadStudentLeaves(this.currentFilters);
    } else {
      this.loadTeacherLeaves(this.currentFilters);
    }
  }
  
  onSortChange(event: SortEvent): void {
    const columnMapping: Record<string, string> = {
      'from_date': this.activeTab === 'student' ? 'student_leaves.from_date' : 'teacher_leaves.from_date',
      'to_date': this.activeTab === 'student' ? 'student_leaves.to_date' : 'teacher_leaves.to_date',
      'full_name': 'users.first_name', // Sort by first_name for full_name column
      'first_name': 'users.first_name',
      'last_name': 'users.last_name',
      'branch_name': this.activeTab === 'student' ? 'branches.name' : 'branches.name',
      'admission_number': 'students.admission_number',
      'grade_label': 'students.grade',
      'section': 'students.section',
      'status': this.activeTab === 'student' ? 'student_leaves.status' : 'teacher_leaves.status',
      'leave_type': this.activeTab === 'student' ? 'student_leaves.leave_type' : 'teacher_leaves.leave_type',
      'employee_id': 'teachers.employee_id'
    };
    
    const sortColumn = columnMapping[event.field] || event.field;
    
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_direction: event.direction
    };
    
    if (this.activeTab === 'student') {
      this.loadStudentLeaves(this.currentFilters);
    } else {
      this.loadTeacherLeaves(this.currentFilters);
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
      this.loadStudentLeaves(filters);
    } else {
      this.loadTeacherLeaves(filters);
    }
  }
  
  onSearchReset(): void {
    this.updateSectionOptions(null);
    
    if (this.activeTab === 'student') {
      this.loadStudentLeaves();
    } else {
      this.loadTeacherLeaves();
    }
  }
  
  viewLeave(leave: StudentLeave | TeacherLeave): void {
    this.router.navigate(['/leaves/view', leave.id], { 
      queryParams: { type: this.activeTab } 
    });
  }
  
  editLeave(leave: StudentLeave | TeacherLeave): void {
    this.router.navigate(['/leaves/edit', leave.id], { 
      queryParams: { type: this.activeTab } 
    });
  }
  
  approveLeave(leave: StudentLeave | TeacherLeave): void {
    if (confirm(`Are you sure you want to approve this leave request?`)) {
      const type = this.activeTab;
      this.leaveService.approveLeave(leave.id, type).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Leave approved successfully');
            if (type === 'student') {
              this.loadStudentLeaves(this.currentFilters);
            } else {
              this.loadTeacherLeaves(this.currentFilters);
            }
          }
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }
  
  rejectLeave(leave: StudentLeave | TeacherLeave): void {
    if (confirm(`Are you sure you want to reject this leave request?`)) {
      const type = this.activeTab;
      this.leaveService.rejectLeave(leave.id, type).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Leave rejected successfully');
            if (type === 'student') {
              this.loadStudentLeaves(this.currentFilters);
            } else {
              this.loadTeacherLeaves(this.currentFilters);
            }
          }
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }
  
  deleteLeave(leave: StudentLeave | TeacherLeave): void {
    if (confirm(`Are you sure you want to delete this leave record?`)) {
      const type = this.activeTab;
      this.leaveService.deleteLeave(leave.id, type).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Leave deleted successfully');
            if (type === 'student') {
              this.loadStudentLeaves(this.currentFilters);
            } else {
              this.loadTeacherLeaves(this.currentFilters);
            }
          }
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }
  
  addStudentLeave(): void {
    this.router.navigate(['/leaves/add'], { queryParams: { type: 'student' } });
  }
  
  addTeacherLeave(): void {
    this.router.navigate(['/leaves/add'], { queryParams: { type: 'teacher' } });
  }
}

