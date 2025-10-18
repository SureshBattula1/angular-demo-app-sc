import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { User } from '../../../../../core/models/user.model';
import { Role, Permission } from '../../../../../core/models/role.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';
import { forkJoin } from 'rxjs';

interface UserWithRole extends User {
  roleDetails?: Role;
  permissionsByModule?: Record<string, Permission[]>;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, HasPermissionDirective],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: UserWithRole[] = [];
  displayedColumns: string[] = ['id', 'name', 'email', 'role', 'branch', 'status', 'actions'];
  isLoading = false;
  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;
  viewMode: 'table' | 'cards' = 'cards';
  expandedUsers: Set<number> = new Set();

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers({
      page: this.currentPage,
      per_page: this.pageSize
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data.data;
          this.totalRecords = response.data.total;
          
          // Load role details for each user
          this.loadUserRoles();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
  }

  loadUserRoles(): void {
    const roleRequests = this.users
      .filter(user => user.role_id)
      .map(user => this.roleService.getRole(user.role_id!));

    if (roleRequests.length === 0) return;

    forkJoin(roleRequests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          if (response.success) {
            const user = this.users.filter(u => u.role_id)[index];
            if (user) {
              user.roleDetails = response.data;
              user.permissionsByModule = this.groupPermissionsByModule(response.data.permissions || []);
            }
          }
        });
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      const moduleKey = permission.module || 'general';
      if (!grouped[moduleKey]) {
        grouped[moduleKey] = [];
      }
      grouped[moduleKey].push(permission);
    });
    return grouped;
  }

  getModules(permissionsByModule: Record<string, Permission[]>): string[] {
    return Object.keys(permissionsByModule).sort();
  }

  getModuleDisplayName(moduleKey: string): string {
    if (!moduleKey) return 'General';
    return moduleKey
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getModuleIcon(moduleKey: string): string {
    const iconMap: { [key: string]: string } = {
      'dashboard': 'dashboard',
      'students': 'school',
      'teachers': 'person',
      'branches': 'business',
      'departments': 'domain',
      'subjects': 'book',
      'grades': 'grade',
      'attendance': 'fact_check',
      'fees': 'payments',
      'accounts': 'account_balance',
      'roles': 'admin_panel_settings',
      'permissions': 'shield',
      'users': 'people',
      'general': 'folder'
    };
    return iconMap[moduleKey.toLowerCase()] || 'folder_special';
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  viewUser(id: number): void {
    this.router.navigate(['/settings/users/view', id]);
  }

  editUser(id: number): void {
    this.router.navigate(['/settings/users/edit', id]);
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete the user "${user.first_name} ${user.last_name}"?`)) {
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

  toggleUserStatus(user: User): void {
    this.userService.toggleUserStatus(user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('User status updated successfully');
          this.loadUsers();
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }

  createUser(): void {
    this.router.navigate(['/settings/users/create']);
  }

  getUserFullName(user: User): string {
    return `${user.first_name} ${user.last_name}`;
  }

  toggleUserExpanded(userId: number): void {
    if (this.expandedUsers.has(userId)) {
      this.expandedUsers.delete(userId);
    } else {
      this.expandedUsers.add(userId);
    }
  }

  isUserExpanded(userId: number): boolean {
    return this.expandedUsers.has(userId);
  }
}

