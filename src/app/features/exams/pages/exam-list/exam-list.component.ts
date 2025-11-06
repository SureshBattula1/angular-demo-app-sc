import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { ExamService, Exam } from '../../services/exam.service';
import { ExamTermService, ExamTerm } from '../../services/exam-term.service';
import { ExamScheduleService, ExamSchedule } from '../../services/exam-schedule.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.scss']
})
export class ExamListComponent implements OnInit {
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

  termsTableConfig: TableConfig = {
    columns: [
      { key: 'code', header: 'Code', sortable: true, width: '120px' },
      { key: 'name', header: 'Term Name', sortable: true },
      { key: 'branch.name', header: 'Branch', sortable: false, width: '150px' },
      { key: 'academic_year', header: 'Academic Year', sortable: true, width: '140px' },
      { key: 'start_date', header: 'Start Date', sortable: true, width: '130px', type: 'date', pipe: 'date' },
      { key: 'end_date', header: 'End Date', sortable: true, width: '130px', type: 'date', pipe: 'date' },
      { key: 'weightage', header: 'Weightage %', sortable: true, width: '120px', align: 'center' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View', action: (row) => this.viewTerm(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editTerm(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteTerm(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50],
    defaultPageSize: 25
  };

  examsTableConfig: TableConfig = {
    columns: [
      { key: 'name', header: 'Exam Name', sortable: true },
      { key: 'exam_type', header: 'Type', type: 'badge', sortable: true, width: '120px' },
      { key: 'academic_year', header: 'Academic Year', sortable: true, width: '140px' },
      { key: 'start_date', header: 'Start Date', sortable: true, width: '130px', type: 'date', pipe: 'date' },
      { key: 'end_date', header: 'End Date', sortable: true, width: '130px', type: 'date', pipe: 'date' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
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
      { key: 'exam.name', header: 'Exam', sortable: false },
      { key: 'subject.name', header: 'Subject', sortable: false },
      { key: 'grade', header: 'Grade', sortable: true, width: '120px', type: 'text' },
      { key: 'section', header: 'Section', sortable: true, width: '100px' },
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
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50],
    defaultPageSize: 25
  };

  constructor(
    private examService: ExamService,
    private examTermService: ExamTermService,
    private examScheduleService: ExamScheduleService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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
    this.examTermService.getExamTerms(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          // Format dates for display
          this.examTerms = (response.data || []).map((term: any) => ({
            ...term,
            start_date: term.start_date ? new Date(term.start_date).toLocaleDateString() : '',
            end_date: term.end_date ? new Date(term.end_date).toLocaleDateString() : ''
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
          // Format dates for display
          this.exams = (response.data || []).map((exam: any) => ({
            ...exam,
            start_date: exam.start_date ? new Date(exam.start_date).toLocaleDateString() : '',
            end_date: exam.end_date ? new Date(exam.end_date).toLocaleDateString() : ''
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
    this.examScheduleService.getSchedules(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          // Transform grade to show "Grade X" format and format dates
          this.schedules = (response.data || []).map((schedule: any) => ({
            ...schedule,
            grade: schedule.grade ? `Grade ${schedule.grade}` : '',
            section: schedule.section || '-',
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
}

