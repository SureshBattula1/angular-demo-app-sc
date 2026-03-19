import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { ExamService, Exam } from '../../services/exam.service';
import { ExamTermService, ExamTerm } from '../../services/exam-term.service';
import { ExamScheduleService, ExamSchedule } from '../../services/exam-schedule.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { AcademicYearService } from '../../../settings/services/academic-year.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.scss']
})
export class ExamListComponent implements OnInit, OnDestroy {
  @ViewChild('termsTable') termsTable!: DataTableComponent;
  @ViewChild('examsTable') examsTable!: DataTableComponent;
  @ViewChild('schedulesTable') schedulesTable!: DataTableComponent;

  loading = false;
  activeTab: 'terms' | 'exams' | 'schedules' = 'terms';
  
  // Track which tabs have been loaded for lazy loading
  private loadedTabs = new Set<string>();

  examTerms: ExamTerm[] = [];
  exams: Exam[] = [];
  schedules: ExamSchedule[] = [];

  termCount = 0;
  examCount = 0;
  scheduleCount = 0;

  currentFilters: Record<string, unknown> = {};
  branches: any[] = [];
  grades: any[] = [];
  examTermsList: any[] = [];
  private academicYearSub?: Subscription;

  termsTableConfig: TableConfig = {
    columns: [
      { key: 'code', header: 'Code', sortable: true, width: '120px' },
      { key: 'name', header: 'Term Name', sortable: true },
      { key: 'branch.name', header: 'Branch', sortable: false },
      { key: 'academic_year', header: 'Academic Year', sortable: true, width: '140px' },
      { key: 'start_date', header: 'Start Date', sortable: true, width: '130px', type: 'date', pipe: 'date' },
      { key: 'end_date', header: 'End Date', sortable: true, width: '130px', type: 'date', pipe: 'date' },
      { key: 'weightage', header: 'Weightage %', sortable: true, width: '120px', align: 'center' },
      { key: 'status_display', header: 'Status', type: 'badge', width: '100px', align: 'center', cellClass: (row: any) => row.is_active ? 'badge-success' : 'badge-danger' }
    ],
    actions: [
      { icon: 'visibility', label: 'View', action: (row) => this.viewTerm(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editTerm(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteTerm(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50],
    defaultPageSize: 25
  };

  examsTableConfig: TableConfig = {
    columns: [
      { key: 'branch.name', header: 'Branch', sortable: true, searchable: true },
      { key: 'name', header: 'Exam Name', sortable: true, searchable: true },      
      { key: 'exam_term_name', header: 'Exam Term', sortable: true, searchable: true, width: '150px' },
      { key: 'academic_year', header: 'Academic Year', sortable: true, searchable: true, width: '140px' },
      { key: 'status_display', header: 'Status', type: 'badge', sortable: true, width: '100px', align: 'center', cellClass: (row: any) => row.is_active ? 'badge-success' : 'badge-danger' }
    ],
    actions: [
      { icon: 'visibility', label: 'View', action: (row) => this.viewExam(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editExam(row) },
      { icon: 'schedule', label: 'Create Schedule', color: 'accent', action: (row) => this.createSchedule(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteExam(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50],
    defaultPageSize: 25
  };

  schedulesTableConfig: TableConfig = {
    columns: [
      { key: 'exam.branch.name', header: 'Branch', sortable: false, searchable: true },
      { key: 'exam.name', header: 'Exam', sortable: false, searchable: true },
      { key: 'exam.academic_year', header: 'Academic Year', sortable: false, searchable: true, width: '130px' },
      { key: 'subject.name', header: 'Subject', sortable: false, searchable: true },
      { key: 'grade', header: 'Class', sortable: true, searchable: true, width: '120px', type: 'text' },
      { key: 'section', header: 'Section', sortable: true, width: '120px', type: 'text' },
      { key: 'exam_date', header: 'Date', sortable: true, width: '130px', type: 'date', pipe: 'date' },
      { key: 'start_time', header: 'Start Time', sortable: false, width: '120px' },
      { key: 'end_time', header: 'End Time', sortable: false, width: '120px' },
      { key: 'total_marks', header: 'Marks', sortable: false, width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View', action: (row) => this.viewSchedule(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editSchedule(row) },
      { icon: 'edit_note', label: 'Enter Marks', color: 'accent', action: (row) => this.enterMarks(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteSchedule(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50],
    defaultPageSize: 25
  };

  // Advanced Search Configurations
  termsSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Exam Term Search',
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
        key: 'academic_year',
        label: 'Academic Year',
        type: 'select',
        icon: 'event',
        options: []
      },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' }
        ]
      }
    ]
  };

  examsSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Exam Search',
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
        key: 'exam_term_id',
        label: 'Exam Term',
        type: 'select',
        icon: 'calendar_today',
        options: []
      },
      {
        key: 'academic_year',
        label: 'Academic Year',
        type: 'select',
        icon: 'event',
        options: []
      },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' }
        ]
      }
    ]
  };

  schedulesSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Schedule Search',
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
        key: 'exam_id',
        label: 'Exam',
        type: 'select',
        icon: 'assignment',
        options: []
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
        icon: 'group',
        options: []
      },
      {
        key: 'exam_date',
        label: 'Exam Date',
        type: 'date',
        icon: 'event'
      }
    ]
  };

  /** Store branch selected in schedule advanced search so we can load sections by grade */
  private scheduleSearchBranchId: number | string | null = null;

  constructor(
    private examService: ExamService,
    private examTermService: ExamTermService,
    private examScheduleService: ExamScheduleService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private academicYearService: AcademicYearService,
    private errorHandler: ErrorHandlerService,
    private academicYearContext: AcademicYearContextService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Load branches, grades, academic years, and exam terms for advanced search
    this.loadBranches();
    this.loadGrades();
    this.loadAcademicYearsForFilter();
    this.loadExamTermsForFilter();
    this.academicYearSub = this.academicYearContext.selectedYearId$.pipe(skip(1)).subscribe(() => this.loadData());
    this.route.queryParams.subscribe(params => {
      // Check for returnTab first (when coming back from view/edit), then tab
      const targetTab = params['returnTab'] || params['tab'];
      
      if (targetTab === 'exams') {
        this.activeTab = 'exams';
      } else if (targetTab === 'schedules') {
        this.activeTab = 'schedules';
      } else {
        this.activeTab = 'terms';
      }
      
      // Mark the initial tab as loaded
      this.loadedTabs.add(this.activeTab);
    });
    
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this.academicYearSub?.unsubscribe();
  }

  // Check if a tab has been loaded (for lazy loading)
  isTabLoaded(tab: string): boolean {
    return this.loadedTabs.has(tab);
  }

  switchTab(tab: 'terms' | 'exams' | 'schedules'): void {
    this.activeTab = tab;
    
    // Mark tab as loaded for lazy loading
    this.loadedTabs.add(tab);
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    this.loadData();
  }

  loadData(): void {
    if (this.activeTab === 'terms') this.loadExamTerms();
    else if (this.activeTab === 'exams') this.loadExams();
    else if (this.activeTab === 'schedules') this.loadSchedules();
  }

  loadExamTerms(): void {
    this.loading = true;
    const filters = { ...this.currentFilters };
    // Use toolbar academic year only when advanced search did not set one
    const hasAcademicYearInSearch = filters['academic_year'] !== undefined && filters['academic_year'] !== null && filters['academic_year'] !== '';
    if (!hasAcademicYearInSearch) {
      const selectedYear = this.academicYearContext.selectedYear;
      if (selectedYear?.name) {
        filters['academic_year'] = selectedYear.name;
      }
    }
    this.examTermService.getExamTerms(filters).subscribe({
      next: (response) => {
        if (response.success) {
          // Format dates for display
          this.examTerms = (response.data || []).map((term: any) => ({
            ...term,
            start_date: term.start_date ? new Date(term.start_date).toLocaleDateString() : '',
            end_date: term.end_date ? new Date(term.end_date).toLocaleDateString() : '',
            status_display: term.is_active ? 'Active' : 'Deactive'
          }));
          if (response.meta) {
            this.termsTableConfig = { ...this.termsTableConfig, totalCount: response.meta.total || 0 };
            this.termCount = response.meta.total || 0;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  loadExams(): void {
    this.loading = true;
    this.examService.getExams(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          // Format dates and add exam term name
          this.exams = (response.data || []).map((exam: any) => ({
            ...exam,
            exam_term_name: exam.exam_term?.name || 'N/A',
            start_date: exam.start_date ? new Date(exam.start_date).toLocaleDateString() : '',
            end_date: exam.end_date ? new Date(exam.end_date).toLocaleDateString() : '',
            status_display: exam.is_active ? 'Active' : 'Deactive'
          }));
          if (response.meta) {
            this.examsTableConfig = { ...this.examsTableConfig, totalCount: response.meta.total || 0 };
            this.examCount = response.meta.total || 0;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  loadSchedules(): void {
    this.loading = true;
    const filters = { ...this.currentFilters };
    const selectedYear = this.academicYearContext.selectedYear;
    if (selectedYear?.id) {
      filters['academic_year_id'] = selectedYear.id;
    } else if (selectedYear?.name) {
      filters['academic_year'] = selectedYear.name;
    }
    this.examScheduleService.getSchedules(filters).subscribe({
      next: (response) => {
        if (response.success) {
          // Transform: show class (grade) and section names in the table
          this.schedules = (response.data || []).map((schedule: any) => ({
            ...schedule,
            grade: (schedule.grade || schedule.grade_level) ? `Grade ${schedule.grade || schedule.grade_level}` : '-',
            section: schedule.section ? String(schedule.section).trim() : '-',
            exam_date: schedule.exam_date ? new Date(schedule.exam_date).toLocaleDateString() : ''
          }));
          if (response.meta) {
            this.schedulesTableConfig = { ...this.schedulesTableConfig, totalCount: response.meta.total || 0 };
            this.scheduleCount = response.meta.total || 0;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  onSearchChange(query: string): void {
    this.currentFilters = { ...this.currentFilters, search: query, page: 1 };
    this.loadData();
  }

  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = { ...this.currentFilters, page: event.page + 1, per_page: event.pageSize };
    this.loadData();
  }

  onSortChange(event: SortEvent): void {
    this.currentFilters = { ...this.currentFilters, sort_by: event.field, sort_direction: event.direction };
    this.loadData();
  }

  // Term Actions
  onTermAction(event: { action: string, row: any }): void {
    const term = event.row as ExamTerm;
    
    switch (event.action) {
      case 'View':
        this.viewTerm(term);
        break;
      case 'Edit':
        this.editTerm(term);
        break;
      case 'Delete':
        this.deleteTerm(term);
        break;
      case 'add':
        this.addExamTerm();
        break;
      default:
        break;
    }
  }

  addExamTerm(): void {
    this.router.navigate(['/exams/term/create']);
  }

  viewTerm(term: ExamTerm): void {
    this.router.navigate(['/exams/term/view', term.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }

  editTerm(term: ExamTerm): void {
    this.router.navigate(['/exams/term/edit', term.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }

  deleteTerm(term: ExamTerm): void {
    if (confirm(`Are you sure you want to delete exam term "${term.name}"?`)) {
      this.examTermService.deleteExamTerm(term.id).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Exam term deleted successfully');
          this.loadExamTerms();
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }

  // Exam Actions
  onExamAction(event: { action: string, row: any }): void {
    const exam = event.row as Exam;
    
    switch (event.action) {
      case 'View':
        this.viewExam(exam);
        break;
      case 'Edit':
        this.editExam(exam);
        break;
      case 'Delete':
        this.deleteExam(exam);
        break;
      case 'Create Schedule':
        this.createSchedule(exam);
        break;
      case 'add':
        this.addExam();
        break;
      default:
        break;
    }
  }

  addExam(): void {
    this.router.navigate(['/exams/create']);
  }

  viewExam(exam: Exam): void {
    this.router.navigate(['/exams/view', exam.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }

  editExam(exam: Exam): void {
    this.router.navigate(['/exams/edit', exam.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }

  deleteExam(exam: Exam): void {
    if (confirm(`Are you sure you want to delete exam "${exam.name}"?`)) {
      this.examService.deleteExam(exam.id).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Exam deleted successfully');
          this.loadExams();
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }

  createSchedule(exam: Exam): void {
    this.router.navigate(['/exams/schedule/create'], { queryParams: { exam_id: exam.id } });
  }

  // Schedule Actions
  onScheduleAction(event: { action: string, row: any }): void {
    const schedule = event.row as ExamSchedule;
    
    switch (event.action) {
      case 'View':
        this.viewSchedule(schedule);
        break;
      case 'Edit':
        this.editSchedule(schedule);
        break;
      case 'Delete':
        this.deleteSchedule(schedule);
        break;
      case 'Enter Marks':
        this.enterMarks(schedule);
        break;
      case 'add':
        this.addSchedule();
        break;
      default:
        break;
    }
  }

  addSchedule(): void {
    this.router.navigate(['/exams/schedule/create']);
  }

  viewSchedule(schedule: ExamSchedule): void {
    this.router.navigate(['/exams/schedule/view', schedule.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }

  editSchedule(schedule: ExamSchedule): void {
    this.router.navigate(['/exams/schedule/edit', schedule.id], {
      queryParams: { returnTab: this.activeTab }
    });
  }

  deleteSchedule(schedule: ExamSchedule): void {
    if (confirm(`Are you sure you want to delete this exam schedule?`)) {
      this.examScheduleService.deleteSchedule(schedule.id).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Schedule deleted successfully');
          this.loadSchedules();
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }

  enterMarks(schedule: ExamSchedule): void {
    this.router.navigate(['/exams/marks/enter'], { 
      queryParams: { 
        schedule_id: schedule.id,
        returnTab: this.activeTab
      } 
    });
  }

  // Load branches for advanced search
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
          const branchOptions = this.branches.map((b: any) => ({
            value: b.id.toString(),
            label: b.name
          }));

          // Update all search configs with branch options
          const termBranchField = this.termsSearchConfig.fields.find(f => f.key === 'branch_id');
          if (termBranchField) termBranchField.options = branchOptions;

          const examBranchField = this.examsSearchConfig.fields.find(f => f.key === 'branch_id');
          if (examBranchField) examBranchField.options = branchOptions;

          const scheduleBranchField = this.schedulesSearchConfig.fields.find(f => f.key === 'branch_id');
          if (scheduleBranchField) scheduleBranchField.options = branchOptions;
        }
      },
      error: () => {}
    });
  }

  // Load academic years for exam term advanced search dropdown
  loadAcademicYearsForFilter(): void {
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const academicYearOptions = response.data.map((y: any) => ({
            value: y.name,
            label: y.name
          }));
          const termYearField = this.termsSearchConfig.fields.find(f => f.key === 'academic_year');
          if (termYearField) termYearField.options = academicYearOptions;
          const examYearField = this.examsSearchConfig.fields.find(f => f.key === 'academic_year');
          if (examYearField) examYearField.options = academicYearOptions;
        }
      },
      error: () => {}
    });
  }

  // Load grades for advanced search
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
          const gradeOptions = response.data.map((grade: any) => ({
            value: grade.value,
            label: grade.label
          }));

          // Update schedule search config with grade options
          const scheduleGradeField = this.schedulesSearchConfig.fields.find(f => f.key === 'grade');
          if (scheduleGradeField) scheduleGradeField.options = gradeOptions;
        }
      },
      error: () => {}
    });
  }

  // Load exam terms for advanced search dropdown (all terms, or filtered by branch when branchId provided)
  loadExamTermsForFilter(branchId?: number | string): void {
    const params: Record<string, unknown> = { is_active: true };
    if (branchId !== undefined && branchId !== null && branchId !== '') {
      params['branch_id'] = Number(branchId);
    }
    this.examTermService.getExamTerms(params).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.examTermsList = response.data;
          const examTermOptions = response.data.map((term: any) => ({
            value: term.id.toString(),
            label: `${term.name} (${term.academic_year})`
          }));

          // Update exam search config with exam term options
          const examTermField = this.examsSearchConfig.fields.find(f => f.key === 'exam_term_id');
          if (examTermField) examTermField.options = examTermOptions;

          // Also update schedule search config to load exams for dropdown (when not branch-scoped)
          if (branchId === undefined || branchId === null || branchId === '') {
            this.loadExamsForScheduleFilter();
          }
        }
      },
      error: () => {}
    });
  }

  // Load exams for schedule advanced search dropdown (all or by branch when branchId provided)
  loadExamsForScheduleFilter(branchId?: number | string): void {
    const params: Record<string, unknown> = { is_active: true };
    if (branchId !== undefined && branchId !== null && branchId !== '') {
      params['branch_id'] = Number(branchId);
    }
    this.examService.getExams(params).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const examOptions = response.data.map((exam: any) => ({
            value: exam.id.toString(),
            label: `${exam.name} (${exam.academic_year || ''})`
          }));

          const scheduleExamField = this.schedulesSearchConfig.fields.find(f => f.key === 'exam_id');
          if (scheduleExamField) scheduleExamField.options = examOptions;
        }
      },
      error: () => {}
    });
  }

  // Load grades for schedule advanced search dropdown (all or by branch when branchId provided)
  loadGradesForScheduleFilter(branchId?: number | string): void {
    const params: Record<string, unknown> = {};
    if (branchId !== undefined && branchId !== null && branchId !== '') {
      params['branch_id'] = Number(branchId);
    }
    this.gradeService.getGrades(params).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const gradeOptions = response.data.map((grade: any) => ({
            value: grade.value,
            label: grade.label
          }));

          const scheduleGradeField = this.schedulesSearchConfig.fields.find(f => f.key === 'grade');
          if (scheduleGradeField) scheduleGradeField.options = gradeOptions;
        }
      },
      error: () => {}
    });
  }

  // Advanced search handlers
  onTermsAdvancedSearch(event: SearchEvent): void {
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.currentFilters = filters;
    this.loadExamTerms();
  }

  onExamsAdvancedSearch(event: SearchEvent): void {
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.currentFilters = filters;
    this.loadExams();
  }

  /** When branch changes in Exams advanced search, load exam terms for that branch */
  onExamsSearchFieldChanged(event: { field: string; value: any }): void {
    if (event.field === 'branch_id') {
      this.loadExamTermsForFilter(event.value);
    }
  }

  onSchedulesAdvancedSearch(event: SearchEvent): void {
    const filters: Record<string, any> = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.currentFilters = filters;
    this.loadSchedules();
  }

  /** When branch or grade changes in Schedules advanced search: branch → load grades & exams; grade → load sections */
  onSchedulesSearchFieldChanged(event: { field: string; value: any }): void {
    if (event.field === 'branch_id') {
      this.scheduleSearchBranchId = event.value;
      this.loadExamsForScheduleFilter(event.value);
      this.loadGradesForScheduleFilter(event.value);
      this.loadSectionsForScheduleFilter(null, null);
    } else if (event.field === 'grade') {
      this.loadSectionsForScheduleFilter(this.scheduleSearchBranchId ?? undefined, event.value);
    }
  }

  // Load sections for schedule advanced search (by branch + grade; when grade is selected show related sections)
  loadSectionsForScheduleFilter(branchId?: number | string | null, gradeLevel?: string | null): void {
    if (branchId === undefined || branchId === null || branchId === '' || gradeLevel === undefined || gradeLevel === null || gradeLevel === '') {
      const sectionField = this.schedulesSearchConfig.fields.find(f => f.key === 'section');
      if (sectionField) sectionField.options = [];
      return;
    }
    this.sectionService.getSections({
      branch_id: Number(branchId),
      grade_level: gradeLevel,
      is_active: true,
      per_page: 500
    }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const sectionOptions = response.data.map((s: any) => ({
            value: s.name,
            label: s.name
          }));
          const sectionField = this.schedulesSearchConfig.fields.find(f => f.key === 'section');
          if (sectionField) sectionField.options = sectionOptions;
        } else {
          const sectionField = this.schedulesSearchConfig.fields.find(f => f.key === 'section');
          if (sectionField) sectionField.options = [];
        }
      },
      error: () => {
        const sectionField = this.schedulesSearchConfig.fields.find(f => f.key === 'section');
        if (sectionField) sectionField.options = [];
      }
    });
  }

  onSearchReset(): void {
    this.currentFilters = {};
    this.loadData();
  }
}

