import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { GradeService } from '../../services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Grade } from '../../../../core/models/grade.model';

@Component({
  selector: 'app-grade-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="grades"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Grade'"
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
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class GradeListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  grades: Grade[] = [];
  selectedGrades: Grade[] = [];
  
  // Current request state
  currentFilters: Record<string, unknown> = {};
  
  // Table Configuration
  tableConfig: TableConfig = {
    columns: [
      { 
        key: 'value', 
        header: 'Grade', 
        sortable: true, 
        width: '100px',
        searchable: true
      },
      { 
        key: 'label', 
        header: 'Display Name', 
        sortable: true, 
        searchable: true,
        width: '120px'
      },
      { 
        key: 'students_count', 
        header: 'Students', 
        type: 'number',
        align: 'center',
        width: '120px'
      },
      { 
        key: 'sections', 
        header: 'Sections', 
        width: '150px',
        align: 'center'
      },
      { 
        key: 'classes_count', 
        header: 'Classes', 
        type: 'number',
        align: 'center',
        width: '100px'
      },
      { 
        key: 'is_active', 
        header: 'Status', 
        type: 'badge',
        width: '100px',
        align: 'center'
      }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View Details',
        action: (row) => this.viewGrade(row)
      },
      {
        icon: 'edit',
        label: 'Edit Grade',
        color: 'primary',
        action: (row) => this.editGrade(row)
      },
      {
        icon: 'people',
        label: 'View Students',
        color: 'accent',
        action: (row) => this.viewStudents(row)
      },
      {
        icon: 'bar_chart',
        label: 'Statistics',
        action: (row) => this.viewStats(row)
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: false,
    totalCount: 0,
    pageSizeOptions: [5, 10, 25, 50],
    defaultPageSize: 12,
    showAddButton: true  // Enable add button for creating new grades
  };
  
  // Advanced Search Configuration
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Grade Search',
    width: '400px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'value',
        label: 'Grade Number',
        type: 'text',
        placeholder: 'Enter grade (1-12)',
        icon: 'filter_1',
        group: 'Basic Information'
      },
      {
        key: 'label',
        label: 'Grade Label',
        type: 'text',
        placeholder: 'Search by label',
        icon: 'label',
        group: 'Basic Information'
      },
      {
        key: 'is_active',
        label: 'Active Only',
        type: 'checkbox',
        icon: 'check_circle',
        group: 'Filters'
      },
      {
        key: 'min_students',
        label: 'Minimum Students',
        type: 'number',
        placeholder: 'Min students count',
        icon: 'people',
        group: 'Statistics'
      }
    ]
  };
  
  constructor(
    private gradeService: GradeService,
    private router: Router,
    private dialog: MatDialog,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadGrades();
  }
  
  /**
   * Load grades from server
   */
  loadGrades(): void {
    this.loading = true;
    
    this.gradeService.getGrades(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.grades = response.data;
          this.tableConfig.totalCount = response.count;
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
    this.loadGrades();
  }
  
  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: event.field,
      sort_direction: event.direction
    };
    this.loadGrades();
  }
  
  /**
   * Handle advanced search changes
   */
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...event.filters,
      search: event.query
    };
    this.loadGrades();
  }
  
  onAction(event: { action: string, row: Grade | null }): void {
    console.log('Action triggered:', event);
    
    // Handle add action
    if (event.action === 'add') {
      this.router.navigate(['/grades/create']);
    }
  }
  
  onRowClick(row: Grade): void {
    this.viewGrade(row);
  }
  
  onSelectionChange(selected: Grade[]): void {
    this.selectedGrades = selected;
    console.log('Selected grades:', selected);
  }
  
  /**
   * View grade details
   */
  viewGrade(grade: Grade): void {
    this.router.navigate(['/grades/view', grade.value]);
  }
  
  /**
   * Edit grade
   */
  editGrade(grade: Grade): void {
    this.router.navigate(['/grades/edit', grade.value]);
  }
  
  /**
   * View students in grade
   */
  viewStudents(grade: Grade): void {
    this.router.navigate(['/students'], { 
      queryParams: { grade: grade.value }
    });
  }
  
  /**
   * View grade statistics
   */
  viewStats(grade: Grade): void {
    this.gradeService.getGradeStats(grade.value).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.errorHandler.showInfo(
            `Grade ${grade.label} - Students: ${response.data.total_students || 0}`
          );
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }
  
  /**
   * Export grades
   */
  onExport(format: string): void {
    this.errorHandler.showInfo(`Export as ${format} - Feature coming soon`);
  }
}

