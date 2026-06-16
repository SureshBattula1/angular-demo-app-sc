import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { BranchService } from '../../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  template: `
    <app-data-table
      #dataTable
      [data]="users"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Users'"
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
export class UserListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  users: User[] = [];
  roles: any[] = [];
  branches: any[] = [];
  currentFilters: Record<string, unknown> = {
    page: 1,
    per_page: 10
  };

  tableConfig: TableConfig = {
    columns: [
      {
        key: 'full_name',
        header: 'Full Name',
        sortable: true
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        type: 'badge'
      },
      {
        key: 'branch.name',
        header: 'Branch',
        sortable: false
      },
      {
        key: 'is_active',
        header: 'Status',
        sortable: true,
        type: 'badge',
        cellClass: (row: any) => row.is_active ? 'text-success' : 'text-danger'
      }
    ],
    actions: [
      {
        label: 'View',
        icon: 'visibility',
        action: (row: User) => this.viewUser(row.id),
        color: 'primary'
      },
      {
        label: 'Edit',
        icon: 'edit',
        action: (row: User) => this.editUser(row.id),
        color: 'info'
      },
      {
        label: 'Permissions',
        icon: 'shield',
        action: (row: User) => this.managePermissions(row.id),
        color: 'accent'
      },
      {
        label: 'Delete',
        icon: 'delete',
        action: (row: User) => this.deleteUser(row),
        color: 'warn'
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
    title: 'Advanced User Search',
    width: '400px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        placeholder: 'Select role',
        icon: 'admin_panel_settings',
        options: []
      },
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        placeholder: 'Select branch',
        icon: 'business',
        options: []
      },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        icon: 'toggle_on',
        options: [
          { value: '1', label: 'Active' },
          { value: '0', label: 'Inactive' }
        ]
      },
      {
        key: 'email',
        label: 'Email',
        type: 'text',
        placeholder: 'Enter email',
        icon: 'email'
      }
    ]
  };

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private branchService: BranchService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadRolesAndBranches();
    this.loadUsers();
  }

  loadRolesAndBranches(): void {
    // Load roles for filter
    this.roleService.getAllRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data || [];
          const roleField = this.advancedSearchConfig.fields.find(f => f.key === 'role');
          if (roleField && this.roles.length > 0) {
            // Map role names to match users table enum values
            const roleMapping: Record<string, string> = {
              'Super Admin': 'SuperAdmin',
              'Branch Admin': 'BranchAdmin',
              'Admin': 'SuperAdmin',
              'Teacher': 'Teacher',
              'Student': 'Student',
              'Parent': 'Parent',
              'Staff': 'Staff'
            };
            
            roleField.options = this.roles.map(r => ({
              value: roleMapping[r.name] || r.name,  // Use mapped enum value
              label: r.name  // Display the friendly name
            }));
            console.log('Roles loaded for filter:', roleField.options);
          }
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.errorHandler.handleError(error);
      }
    });

    // Load branches for filter
    this.branchService.getBranches({}).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data || [];
          const branchField = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = this.branches.map(b => ({
              value: b.id,
              label: b.name
            }));
          }
        }
      },
      error: (error) => console.error('Error loading branches:', error)
    });
  }

  loadUsers(): void {
    this.loading = true;
    console.log('Loading users with filters:', this.currentFilters);
    this.userService.getUsers(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          // Backend now provides full_name and properly structured branch data
          this.users = response.data.data || [];
          console.log('Users loaded:', this.users.length);
          if (this.users.length > 0) {
            console.log('Sample user data:', this.users[0]); // Debug: Check user structure
          }
          this.tableConfig = {
            ...this.tableConfig,
            totalCount: response.data.total || 0
          };
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
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
    this.loadUsers();
  }

  onSortChange(event: SortEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: event.field,
      sort_direction: event.direction
    };
    this.loadUsers();
  }

  onSearchChange(query: string): void {
    this.currentFilters = {
      ...this.currentFilters,
      search: query,
      page: 1
    };
    this.loadUsers();
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    console.log('Advanced search event:', event);
    this.currentFilters = {
      page: 1,
      per_page: this.currentFilters['per_page'] || 10,
      search: event.query,
      ...event.filters
    };
    console.log('Current filters being sent to API:', this.currentFilters);
    this.loadUsers();
  }

  onAction(event: { action: string, row: any }): void {
    // Handle 'add' action from the built-in Add button
    if (event.action === 'add') {
      this.createUser();
    }
  }

  onRowClick(row: User): void {
    this.viewUser(row.id);
  }

  viewUser(id: string | number): void {
    this.router.navigate(['/settings/users/view', id]);
  }

  editUser(id: string | number): void {
    this.router.navigate(['/settings/users/edit', id]);
  }

  managePermissions(id: string | number): void {
    this.router.navigate(['/settings/users', id, 'permissions']);
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('User deleted successfully');
            this.loadUsers();
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
        }
      });
    }
  }

  createUser(): void {
    this.router.navigate(['/settings/users/create']);
  }
}
