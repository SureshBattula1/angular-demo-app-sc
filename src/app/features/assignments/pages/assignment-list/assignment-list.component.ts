import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  PaginationEvent,
  SearchEvent,
  SortEvent,
  TableConfig
} from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AssignmentService } from '../../services/assignment.service';
import { AssignmentListItem } from '../../../../core/models/assignment.model';
import { GradeService } from '../../../grades/services/grade.service';
import { SubjectService } from '../../../subjects/services/subject.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  templateUrl: './assignment-list.component.html',
  styleUrls: ['./assignment-list.component.scss']
})
export class AssignmentListComponent implements OnInit, OnDestroy {
  loading = false;
  assignments: AssignmentListItem[] = [];
  assignmentCount = 0;
  currentFilters: Record<string, unknown> = { page: 1, per_page: 25 };
  private academicYearSub?: Subscription;

  tableConfig: TableConfig = {
    columns: [
      { key: 'title', header: 'Title', sortable: true, searchable: true },
      { key: 'assignment_type', header: 'Type', sortable: false, width: '110px' },
      { key: 'class_display', header: 'Class', sortable: false, width: '140px' },
      { key: 'subject', header: 'Subject', sortable: false },
      { key: 'due_date', header: 'Due Date', sortable: true, width: '130px', type: 'date', pipe: 'date' },
      {
        key: 'status_display',
        header: 'Status',
        type: 'badge',
        width: '120px',
        align: 'center',
        cellClass: (row: AssignmentListItem) => this.statusBadgeClass(row.status)
      },
      { key: 'recipient_count', header: 'Recipients', sortable: false, width: '110px', align: 'center' },
      { key: 'max_marks', header: 'Marks', sortable: false, width: '90px', align: 'center' }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View',
        action: row => this.viewAssignment(row),
        permission: 'assignments.view'
      },
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: row => this.editAssignment(row),
        permission: 'assignments.edit',
        show: (row: AssignmentListItem) => !!row.can_edit
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: row => this.deleteAssignment(row),
        permission: 'assignments.delete',
        show: (row: AssignmentListItem) => !!row.can_edit
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50],
    defaultPageSize: 25,
    showAddButton: true,
    addButtonPermission: 'assignments.create',
    primaryButtonLabel: 'Create Assignment'
  };

  searchConfig: AdvancedSearchConfig = {
    title: 'Advanced Assignment Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'grade',
        label: 'Class',
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
        key: 'subject_id',
        label: 'Subject',
        type: 'select',
        icon: 'menu_book',
        options: []
      },
      {
        key: 'is_published',
        label: 'Published',
        type: 'select',
        icon: 'publish',
        options: [
          { value: 'true', label: 'Published' },
          { value: 'false', label: 'Draft' }
        ]
      },
      {
        key: 'assignment_type',
        label: 'Type',
        type: 'select',
        icon: 'category',
        options: [
          { value: 'Homework', label: 'Homework' },
          { value: 'Project', label: 'Project' },
          { value: 'Quiz', label: 'Quiz' },
          { value: 'Test', label: 'Test' },
          { value: 'Other', label: 'Other' }
        ]
      }
    ]
  };

  constructor(
    private assignmentService: AssignmentService,
    private gradeService: GradeService,
    private subjectService: SubjectService,
    private sectionService: SectionService,
    private errorHandler: ErrorHandlerService,
    private academicYearContext: AcademicYearContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadAssignments();
    this.academicYearSub = this.academicYearContext.selectedYearId$
      .pipe(skip(1))
      .subscribe(() => this.loadAssignments());
  }

  ngOnDestroy(): void {
    this.academicYearSub?.unsubscribe();
  }

  statusBadgeClass(status?: string): string {
    if (status === 'Draft') {
      return 'badge-warning';
    }
    if (status === 'Due') {
      return 'badge-danger';
    }
    return 'badge-success';
  }

  loadFilterOptions(): void {
    this.gradeService.getGrades().subscribe({
      next: response => {
        const field = this.searchConfig.fields.find(f => f.key === 'grade');
        if (field) {
          field.options = (response.data || []).map((grade: { value?: string; label?: string; name?: string }) => ({
            value: String(grade.value ?? grade.name ?? ''),
            label: String(grade.label ?? grade.name ?? grade.value ?? '')
          }));
        }
      },
      error: () => {}
    });

    this.subjectService.getSubjects({ per_page: 100 }).subscribe({
      next: response => {
        const field = this.searchConfig.fields.find(f => f.key === 'subject_id');
        if (field) {
          field.options = (response.data || []).map(subject => ({
            value: String(subject.id),
            label: subject.code ? `${subject.name} (${subject.code})` : subject.name
          }));
        }
      },
      error: () => {}
    });
  }

  loadSectionsForGrade(grade: string): void {
    const sectionField = this.searchConfig.fields.find(f => f.key === 'section');
    if (!sectionField) {
      return;
    }
    if (!grade) {
      sectionField.options = [];
      return;
    }
    this.sectionService.getSections({
      grade_level: grade,
      is_active: true,
      per_page: 1000
    }).subscribe({
      next: (response) => {
        const rows = response.data || [];
        sectionField.options = rows
          .map(section => ({
            value: String(section.name ?? section.code ?? ''),
            label: String(section.name ?? section.code ?? '')
          }))
          .filter(option => !!option.value);
      },
      error: () => {
        sectionField.options = [];
      }
    });
  }

  loadAssignments(): void {
    this.loading = true;
    const params = this.buildRequestParams();
    this.assignmentService.getAssignments(params).subscribe({
      next: response => {
        const rows = response.data || [];
        this.assignments = rows.map(item => ({
          ...item,
          class_display: [item.grade, item.section].filter(Boolean).join(' ') || item.class_name || '-',
          status_display: item.status || (item.is_published ? 'Published' : 'Draft')
        }));
        if (response.meta) {
          const total = response.meta.total || 0;
          this.assignmentCount = total;
          this.tableConfig = { ...this.tableConfig, totalCount: total };
        }
        this.loading = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  onAction(event: { action: string; row: AssignmentListItem | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/assignments/create']);
    }
  }

  onSearchChange(query: string): void {
    this.currentFilters = { ...this.currentFilters, search: query, page: 1 };
    this.loadAssignments();
  }

  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };
    this.loadAssignments();
  }

  onSortChange(event: SortEvent): void {
    const allowed = ['due_date', 'created_at', 'title', 'grade'];
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: allowed.includes(event.field) ? event.field : 'due_date',
      sort_direction: event.direction
    };
    this.loadAssignments();
  }

  onAdvancedSearch(event: SearchEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      ...(event.filters || {}),
      page: 1
    };
    this.loadAssignments();
  }

  onSearchReset(): void {
    this.currentFilters = { page: 1, per_page: this.currentFilters['per_page'] || 25 };
    this.loadAssignments();
  }

  onSearchFieldChanged(event: { field: string; value: unknown }): void {
    if (event.field === 'grade') {
      this.loadSectionsForGrade(event.value ? String(event.value) : '');
    }
  }

  viewAssignment(row: AssignmentListItem): void {
    this.router.navigate(['/assignments/view', row.id]);
  }

  editAssignment(row: AssignmentListItem): void {
    this.router.navigate(['/assignments/edit', row.id]);
  }

  deleteAssignment(row: AssignmentListItem): void {
    if (!row.can_edit) {
      this.errorHandler.showError('Only the teacher who created this assignment can delete it.');
      return;
    }
    if (!confirm(`Delete assignment "${row.title}"? This cannot be undone.`)) {
      return;
    }
    this.assignmentService.deleteAssignment(row.id).subscribe({
      next: response => {
        if (response.success) {
          this.errorHandler.showSuccess(response.message || 'Assignment deleted');
          this.loadAssignments();
        } else {
          this.errorHandler.showError(response.message || 'Failed to delete assignment');
        }
      },
      error: error => this.errorHandler.showError(error)
    });
  }

  private buildRequestParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    Object.entries(this.currentFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }
      if (key === 'is_published') {
        params[key] = value === true || value === 'true';
        return;
      }
      params[key] = value;
    });
    return params;
  }
}
