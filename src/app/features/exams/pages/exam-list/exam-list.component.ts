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
  template: `
    <div class="page-container">
      <div class="tabs-container">
        <div class="tabs-header">
          <button class="tab-item" [class.active]="activeTab === 'terms'" (click)="switchTab('terms')">
            <div class="tab-label-full">
              <mat-icon>calendar_today</mat-icon>
              Exam Terms
              <span class="tab-badge" *ngIf="termCount > 0">{{ termCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>calendar_today</mat-icon>
              Terms
            </div>
          </button>
          
          <button class="tab-item" [class.active]="activeTab === 'exams'" (click)="switchTab('exams')">
            <div class="tab-label-full">
              <mat-icon>assignment</mat-icon>
              Exams
              <span class="tab-badge" *ngIf="examCount > 0">{{ examCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>assignment</mat-icon>
              Exams
            </div>
          </button>
          
          <button class="tab-item" [class.active]="activeTab === 'schedules'" (click)="switchTab('schedules')">
            <div class="tab-label-full">
              <mat-icon>schedule</mat-icon>
              Exam Schedules
              <span class="tab-badge" *ngIf="scheduleCount > 0">{{ scheduleCount }}</span>
            </div>
            <div class="tab-label-short">
              <mat-icon>schedule</mat-icon>
              Schedules
            </div>
          </button>
        </div>

        <div class="tabs-content">
          <!-- Exam Terms Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'terms'">
            <app-data-table
              #termsTable
              [data]="examTerms"
              [config]="termsTableConfig"
              [title]="'Exam Terms'"
              [loading]="loading"
              (actionClicked)="onTermAction($event)"
              (paginationChanged)="onPaginationChange($event)"
              (sortChanged)="onSortChange($event)">
            </app-data-table>
          </div>

          <!-- Exams Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'exams'">
            <app-data-table
              #examsTable
              [data]="exams"
              [config]="examsTableConfig"
              [title]="'Exams'"
              [loading]="loading"
              (actionClicked)="onExamAction($event)"
              (paginationChanged)="onPaginationChange($event)"
              (sortChanged)="onSortChange($event)">
            </app-data-table>
          </div>

          <!-- Schedules Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'schedules'">
            <app-data-table
              #schedulesTable
              [data]="schedules"
              [config]="schedulesTableConfig"
              [title]="'Exam Schedules'"
              [loading]="loading"
              (actionClicked)="onScheduleAction($event)"
              (paginationChanged)="onPaginationChange($event)"
              (sortChanged)="onSortChange($event)">
            </app-data-table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-container { max-width: 1600px; margin: 0 auto; }
  `]
})
export class ExamListComponent implements OnInit {
  @ViewChild('termsTable') termsTable!: DataTableComponent;
  @ViewChild('examsTable') examsTable!: DataTableComponent;
  @ViewChild('schedulesTable') schedulesTable!: DataTableComponent;

  loading = false;
  activeTab: 'terms' | 'exams' | 'schedules' = 'terms';

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
      { key: 'start_date', header: 'Start Date', sortable: true, width: '130px' },
      { key: 'end_date', header: 'End Date', sortable: true, width: '130px' },
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
      { key: 'start_date', header: 'Start Date', sortable: true, width: '130px' },
      { key: 'end_date', header: 'End Date', sortable: true, width: '130px' },
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
      { key: 'grade_level', header: 'Grade', sortable: true, width: '100px' },
      { key: 'section', header: 'Section', sortable: true, width: '100px' },
      { key: 'exam_date', header: 'Date', sortable: true, width: '130px' },
      { key: 'start_time', header: 'Time', sortable: false, width: '120px' },
      { key: 'room_number', header: 'Room', sortable: false, width: '100px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px' }
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
      if (params['tab'] === 'exams') {
        this.activeTab = 'exams';
      } else if (params['tab'] === 'schedules') {
        this.activeTab = 'schedules';
      } else {
        this.activeTab = 'terms';
      }
    });
    
    this.loadData();
  }

  switchTab(tab: 'terms' | 'exams' | 'schedules'): void {
    this.activeTab = tab;
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
          this.examTerms = response.data || [];
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
          this.exams = response.data || [];
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
          this.schedules = response.data || [];
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
    this.router.navigate(['/exams/term/view', term.id]);
  }

  editTerm(term: ExamTerm): void {
    this.router.navigate(['/exams/term/edit', term.id]);
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
    this.router.navigate(['/exams/view', exam.id]);
  }

  editExam(exam: Exam): void {
    this.router.navigate(['/exams/edit', exam.id]);
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
    this.router.navigate(['/exams/schedule/view', schedule.id]);
  }

  editSchedule(schedule: ExamSchedule): void {
    this.router.navigate(['/exams/schedule/edit', schedule.id]);
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
    this.router.navigate(['/exams/marks/entry'], { queryParams: { schedule_id: schedule.id } });
  }
}

