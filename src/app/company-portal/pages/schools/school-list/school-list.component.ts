import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { CompanySchoolService } from '../../../services/school.service';
import { School } from '../../../../core/models/school.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ExportService } from '../../../../shared/services/export.service';
import { SchoolUserSelectionComponent, SchoolUserSelectionData } from '../school-user-selection/school-user-selection.component';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="schools"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Schools'"
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
export class SchoolListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  schools: School[] = [];
  selectedSchools: School[] = [];
  
  // Current request state
  currentFilters: Record<string, unknown> = {};
  
  // Table Configuration
  tableConfig: TableConfig = {
    columns: [
      { 
        key: 'code', 
        header: 'Code', 
        sortable: true, 
        searchable: true,
        width: '120px'
      },
      { 
        key: 'name', 
        header: 'School Name', 
        sortable: true, 
        searchable: true
      },
      { 
        key: 'company.name', 
        header: 'Company', 
        sortable: false,
        width: '160px'
      },
      { 
        key: 'status', 
        header: 'Status', 
        sortable: true,
        type: 'badge',
        width: '140px',
        align: 'center'
      },
      { 
        key: 'branches_count', 
        header: 'Branches',
        type: 'number',
        align: 'center',
        width: '120px'
      },
      { 
        key: 'total_students', 
        header: 'Students',
        type: 'number',
        align: 'center',
        width: '120px'
      },
      { 
        key: 'total_teachers', 
        header: 'Teachers',
        type: 'number',
        align: 'center',
        width: '120px'
      }
    ],
    actions: [
      {
        icon: 'login',
        label: 'Access School',
        color: 'accent',
        action: (row) => this.accessSchool(row),
      },
      {
        icon: 'visibility',
        label: 'View Details',
        action: (row) => this.viewSchool(row),
      },
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row) => this.editSchool(row),
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row) => this.deleteSchool(row),
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
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    showAddButton: true
  };
  
  // Advanced Search Configuration
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced School Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'name',
        label: 'School Name',
        type: 'text',
        placeholder: 'Enter school name',
        icon: 'school',
        group: 'Basic Information'
      },
      {
        key: 'code',
        label: 'School Code',
        type: 'text',
        placeholder: 'Enter school code',
        icon: 'qr_code',
        group: 'Basic Information'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'toggle_on',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' },
          { value: 'Suspended', label: 'Suspended' },
          { value: 'UnderConstruction', label: 'Under Construction' }
        ],
        group: 'Basic Information'
      }
    ]
  };
  
  constructor(
    private schoolService: CompanySchoolService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadSchools();
  }
  
  /**
   * Load schools from server with pagination and sorting
   */
  loadSchools(): void {
    this.loading = true;
    
    this.schoolService.getSchools(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.schools = response.data || [];
          // Update total count from meta for server-side pagination
          if (response.meta) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.meta.total };
          } else {
            this.tableConfig.totalCount = response.data?.length || 0;
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
    this.loadSchools();
  }
  
  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    const columnMapping: Record<string, string> = {
      'status': 'status',
      'branches_count': 'branches_count',
      'total_students': 'total_students',
      'total_teachers': 'total_teachers'
    };
    
    const sortColumn = columnMapping[event.field] || event.field;
    
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_direction: event.direction
    };
    
    this.loadSchools();
  }
  
  /**
   * Handle advanced search changes
   */
  onAdvancedSearchChange(event: SearchEvent): void {
    // Reset to first page when searching
    this.currentFilters = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadSchools();
  }
  
  onAction(event: { action: string, row: School | null }): void {
    // Handle add action
    if (event.action === 'add') {
      this.router.navigate(['/company-portal/schools/create']);
    }
  }
  
  onRowClick(row: School): void {
    this.viewSchool(row);
  }
  
  onSelectionChange(selected: School[]): void {
    this.selectedSchools = selected;
  }
  
  /**
   * Access school via user selection
   */
  accessSchool(school: School): void {
    const dialogData: SchoolUserSelectionData = {
      schoolId: school.id,
      schoolName: school.name
    };

    this.dialog.open(SchoolUserSelectionComponent, {
      width: '1000px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });
  }

  /**
   * View school details
   */
  viewSchool(school: School): void {
    this.router.navigate(['/company-portal/schools', school.id]);
  }
  
  /**
   * Edit school
   */
  editSchool(school: School): void {
    this.router.navigate(['/company-portal/schools', school.id, 'edit']);
  }
  
  /**
   * Delete school with confirmation
   */
  deleteSchool(school: School): void {
    if (confirm(`Are you sure you want to delete school "${school.name}"? This action cannot be undone.`)) {
      this.schoolService.deleteSchool(school.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('School deleted successfully');
            this.loadSchools();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  /**
   * Export schools
   */
  onExport(format: 'excel' | 'pdf' | 'csv'): void {
    // Show loading message
    this.errorHandler.showInfo(`Exporting as ${format.toUpperCase()}...`);
    
    // Call export service with current filters
    this.exportService.export(
      {
        endpoint: '/company-portal/schools/export',
        filename: 'schools'
      },
      {
        format: format,
        filters: this.currentFilters
      }
    );
  }
}
