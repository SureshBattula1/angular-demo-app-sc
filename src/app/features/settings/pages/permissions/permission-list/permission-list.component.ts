import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { PermissionService } from '../../../services/permission.service';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { Permission } from '../../../../../core/models/role.model';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="permissions"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Permissions'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (searchChanged)="onSearchChange($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class PermissionListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  permissions: Permission[] = [];
  currentFilters: Record<string, unknown> = {
    page: 1,
    per_page: 10
  };

  tableConfig: TableConfig = {
    columns: [
      {
        key: 'name',
        header: 'Permission Name',
        sortable: true
      },
      {
        key: 'slug',
        header: 'Slug',
        sortable: true,
        cellClass: 'text-monospace'
      },
      {
        key: 'module',
        header: 'Module',
        sortable: true,
        type: 'badge'
      },
      {
        key: 'action',
        header: 'Action',
        sortable: true,
        type: 'badge',
        width: '120px'
      },
      {
        key: 'is_system_permission',
        header: 'System',
        sortable: true,
        type: 'badge',
        width: '100px'
      }
    ],
    actions: [
      {
        label: 'View',
        icon: 'visibility',
        action: (row: Permission) => this.viewPermission(row),
        color: 'primary'
      }
    ],
    serverSide: true,
    pagination: true,
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    totalCount: 0,
    searchable: true,
    advancedSearch: true,
    filterable: true,
    exportable: true,
    selectable: false,
    responsive: true,
    showAddButton: false
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Permission Search',
    width: '400px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'module',
        label: 'Module',
        type: 'select',
        placeholder: 'Select module',
        icon: 'widgets',
        options: [
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'students', label: 'Students' },
          { value: 'teachers', label: 'Teachers' },
          { value: 'attendance', label: 'Attendance' },
          { value: 'branches', label: 'Branches' },
          { value: 'accounts', label: 'Accounts' },
          { value: 'fees', label: 'Fees' },
          { value: 'exams', label: 'Exams' },
          { value: 'grades', label: 'Grades' },
          { value: 'sections', label: 'Sections' },
          { value: 'subjects', label: 'Subjects' },
          { value: 'departments', label: 'Departments' },
          { value: 'holidays', label: 'Holidays' },
          { value: 'invoices', label: 'Invoices' },
          { value: 'groups', label: 'Groups' },
          { value: 'reports', label: 'Reports' },
          { value: 'settings', label: 'Settings' },
          { value: 'users', label: 'Users' }
        ]
      },
      {
        key: 'action',
        label: 'Action',
        type: 'select',
        placeholder: 'Select action',
        icon: 'play_arrow',
        options: [
          { value: 'view', label: 'View' },
          { value: 'create', label: 'Create' },
          { value: 'edit', label: 'Edit' },
          { value: 'delete', label: 'Delete' },
          { value: 'export', label: 'Export' },
          { value: 'approve', label: 'Approve' },
          { value: 'reject', label: 'Reject' }
        ]
      },
      {
        key: 'is_system_permission',
        label: 'Permission Type',
        type: 'select',
        icon: 'verified',
        options: [
          { value: '1', label: 'System Permission' },
          { value: '0', label: 'Custom Permission' }
        ]
      },
      {
        key: 'slug',
        label: 'Slug',
        type: 'text',
        placeholder: 'Enter slug',
        icon: 'label'
      }
    ]
  };

  constructor(
    private permissionService: PermissionService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.loading = true;
    this.permissionService.getPermissions(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.permissions = response.data.data || [];
          this.tableConfig = {
            ...this.tableConfig,
            totalCount: response.data.total || 0
          };
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading = false;
      }
    });
  }

  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };
    this.loadPermissions();
  }

  onSortChange(event: SortEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: event.field,
      sort_direction: event.direction
    };
    this.loadPermissions();
  }

  onSearchChange(query: string): void {
    this.currentFilters = {
      ...this.currentFilters,
      search: query,
      page: 1
    };
    this.loadPermissions();
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      page: 1,
      per_page: this.currentFilters['per_page'] || 10,
      search: event.query,
      ...event.filters
    };
    this.loadPermissions();
  }

  onAction(event: { action: string, row: any }): void {

  }

  onRowClick(row: Permission): void {
    this.viewPermission(row);
  }

  viewPermission(permission: Permission): void {
    this.errorHandler.showSuccess(`Permission: ${permission.name} (${permission.slug})`);
  }
}
