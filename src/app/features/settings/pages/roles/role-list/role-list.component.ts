import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { RoleService } from '../../../services/role.service';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { Role } from '../../../../../core/models/role.model';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  template: `
    <app-data-table
      #dataTable
      [data]="roles"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Roles'"
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
export class RoleListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  roles: Role[] = [];
  currentFilters: Record<string, unknown> = {
    page: 1,
    per_page: 10
  };

  tableConfig: TableConfig = {
    columns: [
      {
        key: 'name',
        header: 'Role Name',
        sortable: true
      },
      {
        key: 'slug',
        header: 'Slug',
        sortable: true,
        cellClass: 'text-monospace'
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false
      },
      {
        key: 'level',
        header: 'Level',
        sortable: true,
        width: '100px',
        type: 'badge'
      },
      {
        key: 'is_system_role',
        header: 'System Role',
        sortable: true,
        type: 'badge',
        width: '120px'
      }
    ],
    actions: [
      {
        label: 'View',
        icon: 'visibility',
        action: (row: Role) => this.viewRole(row.id),
        color: 'primary'
      },
      {
        label: 'Edit',
        icon: 'edit',
        action: (row: Role) => this.editRole(row.id),
        color: 'accent',
        show: (row: Role) => !row.is_system_role
      },
      {
        label: 'Delete',
        icon: 'delete',
        action: (row: Role) => this.deleteRole(row),
        color: 'warn',
        show: (row: Role) => !row.is_system_role
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
    responsive: true
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Role Search',
    width: '400px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'level',
        label: 'Level',
        type: 'select',
        placeholder: 'Select level',
        icon: 'layers',
        options: [
          { value: '1', label: 'Level 1 (Super Admin)' },
          { value: '2', label: 'Level 2 (Branch Admin)' },
          { value: '3', label: 'Level 3 (Teacher)' },
          { value: '4', label: 'Level 4 (Staff/Accountant)' },
          { value: '5', label: 'Level 5 (Student)' },
          { value: '6', label: 'Level 6 (Parent)' }
        ]
      },
      {
        key: 'is_system_role',
        label: 'Role Type',
        type: 'select',
        icon: 'verified',
        options: [
          { value: '1', label: 'System Role' },
          { value: '0', label: 'Custom Role' }
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
    private roleService: RoleService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService.getRoles(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data.data || [];
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
    this.loadRoles();
  }

  onSortChange(event: SortEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: event.field,
      sort_direction: event.direction
    };
    this.loadRoles();
  }

  onSearchChange(query: string): void {
    this.currentFilters = {
      ...this.currentFilters,
      search: query,
      page: 1
    };
    this.loadRoles();
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      page: 1,
      per_page: this.currentFilters['per_page'] || 10,
      search: event.query,
      ...event.filters
    };
    this.loadRoles();
  }

  onAction(event: { action: string, row: any }): void {
    // Handle 'add' action from the built-in Add button
    if (event.action === 'add') {
      this.createRole();
    }
  }

  onRowClick(row: Role): void {
    this.viewRole(row.id);
  }

  viewRole(id: number): void {
    this.router.navigate(['/settings/roles/view', id]);
  }

  editRole(id: number): void {
    this.router.navigate(['/settings/roles/edit', id]);
  }

  deleteRole(role: Role): void {
    if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      this.roleService.deleteRole(role.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Role deleted successfully');
            this.loadRoles();
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
        }
      });
    }
  }

  createRole(): void {
    this.router.navigate(['/settings/roles/create']);
  }
}
