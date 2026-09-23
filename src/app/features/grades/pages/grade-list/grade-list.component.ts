import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { GradeService } from '../../services/grade.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ExportService } from '../../../../shared/services/export.service';
import { PermissionService } from '../../../../core/services/permission.service';
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
      [title]="' Classes (Grades)'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)"
      (searchResetEvent)="onSearchReset()">
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

  private branchIdToName: Record<string, string> = {};

  // Table Configuration
  tableConfig: TableConfig = {
    columns: [
      // {
      //   key: 'order',
      //   header: 'Order',
      //   sortable: true,
      //   type: 'number',
      //   align: 'center',
      //   width: '80px'
      // },
      {
        key: 'branch_name',
        header: 'Branch',
        sortable: false,
        width: '180px',
        searchable: false
      },
      {
        key: 'value',
        header: 'Grade',
        sortable: true,
        width: '100px',
        searchable: true
      },
    
      {
        key: 'label',
        header: 'Name',
        sortable: true,
        searchable: true,
        width: '180px'
      },
      {
        key: 'category',
        header: 'Category',
        type: 'text',
        sortable: true,
        width: '150px',
        searchable: true
      },
      {
        key: 'students_count',
        header: 'Students',
        type: 'number',
        align: 'center',
        width: '100px'
      },
      {
        key: 'sections',
        header: 'Sections',
        width: '120px',
        align: 'center'
      },
      {
        key: 'status_label',
        header: 'Status',
        type: 'badge',
        width: '100px',
        align: 'center',
        cellClass: (row: any) => (row?.is_active === false || row?.status_label === 'Deactive') ? 'badge-danger' : 'badge-success'
      }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View Details',
        action: (row) => this.viewGrade(row),
        permission: 'grades.view'
      },
      {
        icon: 'edit',
        label: 'Edit Grade',
        color: 'primary',
        action: (row) => this.editGrade(row),
        permission: 'grades.edit'
      },
      {
        icon: 'people',
        label: 'View Students',
        color: 'accent',
        action: (row) => this.viewStudents(row),
        permission: 'students.view'
      },
      {
        icon: 'bar_chart',
        label: 'Statistics',
        action: (row) => this.viewStats(row),
        permission: 'grades.view'
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [5, 10, 25, 50],
    defaultPageSize: 25,
    showAddButton: true,
    addButtonPermission: 'grades.create'
  };

  // Advanced Search Configuration
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Grade Search',
    width: '450px',
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
      },
      {
        key: 'value',
        label: 'Grade Value',
        type: 'text',
        placeholder: 'e.g., LKG, UKG, 1, 2...',
        icon: 'tag',
      },
      {
        key: 'label',
        label: 'Grade Name',
        type: 'text',
        placeholder: 'Search by label',
        icon: 'label',
      },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        placeholder: 'Select category',
        icon: 'category',
        options: [
          { value: 'Pre-Primary', label: 'Pre-Primary' },
          { value: 'Primary', label: 'Primary' },
          { value: 'Middle', label: 'Middle' },
          { value: 'Secondary', label: 'Secondary' },
          { value: 'Senior-Secondary', label: 'Senior-Secondary' }
        ],
      },
      // {
      //   key: 'is_active',
      //   label: 'Active Only',
      //   type: 'checkbox',
      //   icon: 'check_circle',
      //   group: 'Status'
      // }
    ]
  };

  constructor(
    private gradeService: GradeService,
    private branchService: BranchService,
    private router: Router,
    private dialog: MatDialog,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.loadBranches();
    this.loadGrades();
  }

  /**
   * Load branches dynamically for advanced search filter
   */
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branchIdToName = response.data.reduce((acc, b) => {
            acc[String(b.id)] = b.name;
            return acc;
          }, {} as Record<string, string>);

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
   * Load grades from server
   */
  loadGrades(): void {
    this.loading = true;

    this.gradeService.getGrades(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          const branchId = this.currentFilters['branch_id']?.toString?.() ?? (this.currentFilters['branch_id'] as any);

          // Ensure branch name is present for display (prefer API, fallback to lookup when filtered).
          const branchNameFallback = branchId ? (this.branchIdToName[String(branchId)] ?? '') : '';

          this.grades = (response.data || []).map(g => ({
            ...g,
            ...(g.branch_name ? {} : { branch_name: branchNameFallback }),
            status_label: g.is_active ? 'Active' : 'Deactive'
          }) as any);
          if (response.meta) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.meta.total };
          } else if (response.count) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.count };
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
      search: event.query,
      page: 1
    };
    this.loadGrades();
  }

  onSearchReset(): void {
    this.currentFilters = {};
    this.loadGrades();
  }

  onAction(event: { action: string, row: Grade | null }): void {

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
  }

  /**
   * View grade details
   */
  viewGrade(grade: Grade): void {
    this.router.navigate(['/grades/view', grade.value], {
      queryParams: { branch_id: (grade as any).branch_id ?? null }
    });
  }

  /**
   * Edit grade
   */
  editGrade(grade: Grade): void {
    this.router.navigate(['/grades/edit', grade.value], {
      queryParams: { branch_id: (grade as any).branch_id ?? null }
    });
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
  onExport(format: 'excel' | 'pdf' | 'csv'): void {
    // Show loading message
    this.errorHandler.showInfo(`Exporting as ${format.toUpperCase()}...`);

    // Call export service (grades don't have complex filters, so pass empty object)
    this.exportService.export(
      {
        endpoint: '/grades/export',
        filename: 'grades'
      },
      {
        format: format,
        filters: {}
      }
    );
  }
}

