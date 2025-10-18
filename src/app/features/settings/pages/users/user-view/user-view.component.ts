import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { User } from '../../../../../core/models/user.model';
import { Role, Permission } from '../../../../../core/models/role.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, HasPermissionDirective],
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  user: User | null = null;
  userId: number | null = null;
  isLoading = false;
  userRole: Role | null = null;
  permissionsByModule: Record<string, Permission[]> = {};

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = parseInt(id, 10);
      this.loadUser();
    }
  }

  loadUser(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    this.userService.getUser(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.user = response.data;
          // Load role details if user has role_id
          if (this.user.role_id) {
            this.loadUserRole(this.user.role_id);
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
  }

  loadUserRole(roleId: number): void {
    this.roleService.getRole(roleId).subscribe({
      next: (response) => {
        if (response.success) {
          this.userRole = response.data;
          this.groupPermissionsByModule();
        }
      },
      error: (error) => {
        console.error('Error loading role:', error);
      }
    });
  }

  groupPermissionsByModule(): void {
    if (!this.userRole?.permissions) return;
    
    this.permissionsByModule = {};
    this.userRole.permissions.forEach(permission => {
      const moduleKey = permission.module || 'general';
      
      if (!this.permissionsByModule[moduleKey]) {
        this.permissionsByModule[moduleKey] = [];
      }
      this.permissionsByModule[moduleKey].push(permission);
    });
  }

  getModules(): string[] {
    return Object.keys(this.permissionsByModule).sort();
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
      'classes': 'class',
      'sections': 'view_module',
      'groups': 'groups',
      'attendance': 'fact_check',
      'fees': 'payments',
      'accounts': 'account_balance',
      'transactions': 'receipt_long',
      'invoices': 'receipt',
      'holidays': 'event',
      'exams': 'quiz',
      'library': 'local_library',
      'transport': 'directions_bus',
      'roles': 'admin_panel_settings',
      'permissions': 'shield',
      'users': 'people',
      'settings': 'settings',
      'general': 'folder'
    };

    return iconMap[moduleKey.toLowerCase()] || 'folder_special';
  }

  editUser(): void {
    if (this.userId) {
      this.router.navigate(['/settings/users/edit', this.userId]);
    }
  }

  deleteUser(): void {
    if (!this.user) return;
    
    if (confirm(`Are you sure you want to delete the user "${this.user.first_name} ${this.user.last_name}"?`)) {
      this.userService.deleteUser(this.user.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('User deleted successfully');
            this.router.navigate(['/settings/users']);
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
        }
      });
    }
  }

  toggleStatus(): void {
    if (!this.user) return;
    
    this.userService.toggleUserStatus(this.user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('User status updated successfully');
          this.loadUser();
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/settings/users']);
  }

  getUserFullName(): string {
    return this.user ? `${this.user.first_name} ${this.user.last_name}` : '';
  }

  getStatusColor(): string {
    return this.user?.is_active ? 'primary' : 'warn';
  }

  getStatusText(): string {
    return this.user?.is_active ? 'Active' : 'Inactive';
  }
}

