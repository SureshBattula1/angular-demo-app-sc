import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { SubjectService } from '../../services/subject.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { Subject } from '../../../../core/models/subject.model';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="subjects"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Subjects'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class SubjectListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  subjects: Subject[] = [];
  selectedSubjects: Subject[] = [];
  currentFilters: Record<string, unknown> = {};
  
  customActions = [
    {
      label: 'Assign Subjects',
      icon: 'assignment',
      color: 'accent' as const,
      action: () => this.router.navigate(['/subjects/assign'])
    }
  ];
  
  tableConfig: TableConfig = {
    columns: [
      // { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'code', header: 'Code', sortable: true, searchable: true, width: '120px' },
      { key: 'name', header: 'Subject Name', sortable: true, searchable: true },
      { key: 'branch.name', header: 'Branch', sortable: true, width: '150px' },
      { key: 'type', header: 'Type', sortable: true, type: 'badge', width: '110px', align: 'center' },
      { key: 'grade_label', header: 'Grade', sortable: true, width: '120px', align: 'center' },
      { key: 'credits', header: 'Credits', type: 'number', align: 'center', width: '100px' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewSubject(row), permission: 'subjects.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editSubject(row), permission: 'subjects.edit' },
      { icon: 'assignment', label: 'Assign to Sections', color: 'accent', action: (row) => this.assignToSections(row), permission: 'subjects.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteSubject(row), permission: 'subjects.delete' }
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
    addButtonPermission: 'subjects.create'
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Subject Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        placeholder: 'Select branch',
        icon: 'business',
        options: [], // Will be populated dynamically
        // group: 'Basic'
      },
      {
        key: 'code',
        label: 'Subject Code',
        type: 'text',
        placeholder: 'Enter subject code',
        icon: 'qr_code',
        // group: 'Basic'
      },
      {
        key: 'type',
        label: 'Subject Type',
        type: 'select',
        icon: 'category',
        options: [
          { value: 'Core', label: 'Core' },
          { value: 'Elective', label: 'Elective' },
          { value: 'Language', label: 'Language' },
          { value: 'Lab', label: 'Lab' },
          { value: 'Activity', label: 'Activity' }
        ],
        // group: 'Type'
      },
      {
        key: 'grade_level',
        label: 'Grade Level',
        type: 'select',
        icon: 'school',
        options: [], // Will be populated dynamically
        // group: 'Grade'
      },
      {
        key: 'is_active',
        label: 'Active Only',
        type: 'checkbox',
        icon: 'check_circle',
        // group: 'Status'
      }
    ]
  };
  
  constructor(
    private subjectService: SubjectService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadGrades();
    this.loadSubjects();
  }
  
  /**
   * Load branches dynamically for advanced search filter
   */
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const branchField = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = response.data.map(branch => ({
              value: branch.id.toString(),
              label: branch.name
            }));
          }
        }
      },
      error: (error) => {
      }
    });
  }
  
  /**
   * Load grades dynamically for advanced search filter
   */
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const gradeField = this.advancedSearchConfig.fields.find(f => f.key === 'grade_level');
          if (gradeField) {
            gradeField.options = response.data.map(grade => ({
              value: grade.value,
              label: grade.label
            }));
          }
        }
      },
      error: (error) => {
      }
    });
  }
  
  loadSubjects(): void {
    this.loading = true;
    
    this.subjectService.getSubjects(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.subjects = response.data || [];
          if (response.meta) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.meta.total };
          }
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
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
    this.loadSubjects();
  }
  
  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    const columnMapping: Record<string, string> = {
      'code': 'code',
      'name': 'name',
      'branch.name': 'branch_id',
      'type': 'type',
      'grade_label': 'grade_level',
      'credits': 'credits',
      'is_active': 'is_active'
    };
    
    const sortColumn = columnMapping[event.field] || event.field;
    
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_direction: event.direction
    };
    this.loadSubjects();
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadSubjects();
  }
  
  onAction(event: { action: string, row: Subject | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/subjects/create']);
    }
  }
  
  onRowClick(row: Subject): void {
    this.viewSubject(row);
  }
  
  onSelectionChange(selected: Subject[]): void {
    this.selectedSubjects = selected;
  }
  
  viewSubject(subject: Subject): void {
    this.router.navigate(['/subjects/view', subject.id]);
  }
  
  editSubject(subject: Subject): void {
    this.router.navigate(['/subjects/edit', subject.id]);
  }
  
  deleteSubject(subject: Subject): void {
    if (confirm(`Are you sure you want to delete subject "${subject.name}"?`)) {
      this.subjectService.deleteSubject(subject.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Subject deleted successfully');
            this.loadSubjects();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  assignToSections(subject: Subject): void {
    // Navigate to assignment page
    this.router.navigate(['/subjects/assign']);
  }
  
  onExport(format: string): void {
    this.errorHandler.showInfo(`Export as ${format} - Feature coming soon`);
  }
}

