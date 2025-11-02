import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { Department } from '../../../../core/models/department.model';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="departments"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Departments'"
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
export class DepartmentListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  departments: Department[] = [];
  selectedDepartments: Department[] = [];
  currentFilters: Record<string, unknown> = {};
  
  tableConfig: TableConfig = {
    columns: [
      // { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'name', header: 'Name', sortable: true, searchable: true },
      { key: 'head', header: 'Head', sortable: true, searchable: true },
      { key: 'branch.name', header: 'Branch', sortable: true, width: '150px' },
      { key: 'established_date', header: 'Established', sortable: true, type: 'date', width: '130px' },
      { key: 'students_count', header: 'Students', type: 'number', align: 'center', width: '100px' },
      { key: 'teachers_count', header: 'Teachers', type: 'number', align: 'center', width: '100px' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewDepartment(row), permission: 'departments.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editDepartment(row), permission: 'departments.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteDepartment(row), permission: 'departments.delete' }
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
    addButtonPermission: 'departments.create'
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Department Search',
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
        // group: 'Basic'
      },
      {
        key: 'name',
        label: 'Department Name',
        type: 'text',
        placeholder: 'Enter department name',
        icon: 'apartment',
        // group: 'Basic'
      },
      {
        key: 'head',
        label: 'Department Head',
        type: 'text',
        placeholder: 'Enter head name',
        icon: 'person',
        // group: 'Basic'
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
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadDepartments();
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
  
  loadDepartments(): void {
    this.loading = true;
    
    this.departmentService.getDepartments(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.departments = response.data || [];
          if (response.meta) {
            // Update config by creating a new reference to trigger Angular change detection
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
      page: event.page + 1, // Backend expects 1-based page numbers
      per_page: event.pageSize
    };
    this.loadDepartments();
  }
  
  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    // Map frontend column names to backend column names
    const columnMapping: Record<string, string> = {
      'name': 'name',
      'head': 'head',
      'branch.name': 'branch_id',
      'established_date': 'established_date',
      'students_count': 'students_count',
      'teachers_count': 'teachers_count',
      'is_active': 'is_active'
    };
    
    const sortColumn = columnMapping[event.field] || event.field;
    
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_direction: event.direction
    };
    this.loadDepartments();
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    // Reset to first page when searching
    this.currentFilters = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadDepartments();
  }
  
  onAction(event: { action: string, row: Department | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/departments/create']);
    }
  }
  
  onRowClick(row: Department): void {
    this.viewDepartment(row);
  }
  
  onSelectionChange(selected: Department[]): void {
    this.selectedDepartments = selected;
  }
  
  viewDepartment(department: Department): void {
    this.router.navigate(['/departments/view', department.id]);
  }
  
  editDepartment(department: Department): void {
    this.router.navigate(['/departments/edit', department.id]);
  }
  
  deleteDepartment(department: Department): void {
    if (confirm(`Are you sure you want to delete department "${department.name}"?`)) {
      this.departmentService.deleteDepartment(department.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Department deleted successfully');
            this.loadDepartments();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  onExport(format: string): void {
    this.errorHandler.showInfo(`Export as ${format} - Feature coming soon`);
  }
}

