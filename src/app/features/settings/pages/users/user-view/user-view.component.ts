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

interface GroupedPermissions {
  module_name: string;
  module_slug: string;
  module_icon: string;
  permissions: any[];
}

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, HasPermissionDirective],
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  user: User | null = null;
  userId: string | null = null;
  isLoading = false;
  userRole: Role | null = null;
  permissionsByModule: Record<string, Permission[]> = {};
  groupedRolePermissions: GroupedPermissions[] = [];
  groupedUserPermissions: GroupedPermissions[] = [];
  userPermissions: any[] = []; // Initialized as empty array

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
      this.userId = id;
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
          // Load user-specific permissions
          this.loadUserPermissions();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
  }

  loadUserPermissions(): void {
    if (!this.userId) return;
    
    this.userService.getUserPermissions(this.userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Ensure it's always an array
          this.userPermissions = Array.isArray(response.data) ? response.data : [];
          if (this.userPermissions.length > 0) {
            this.groupUserPermissions();
          }
        } else {
          this.userPermissions = [];
        }
      },
      error: (error) => {
        // Silently fail - user might not have custom permissions
        this.userPermissions = [];
        console.log('No user-specific permissions found');
      }
    });
  }

  groupUserPermissions(): void {
    if (!this.userPermissions || !Array.isArray(this.userPermissions) || this.userPermissions.length === 0) return;

    this.groupedUserPermissions = [];
    const moduleMap = new Map<string, GroupedPermissions>();

    this.userPermissions.forEach((perm: any) => {
      const moduleSlug = perm.module_slug || perm.module || 'general';
      const moduleName = perm.module_name || this.getModuleDisplayName(moduleSlug);
      
      if (!moduleMap.has(moduleSlug)) {
        moduleMap.set(moduleSlug, {
          module_name: moduleName,
          module_slug: moduleSlug,
          module_icon: this.getModuleIcon(moduleSlug),
          permissions: []
        });
      }
      
      moduleMap.get(moduleSlug)?.permissions.push(perm);
    });

    this.groupedUserPermissions = Array.from(moduleMap.values());
  }

  loadUserRole(roleId: number | string): void {
    this.roleService.getRole(roleId).subscribe({
      next: (response) => {
        if (response.success) {
          this.userRole = response.data;
          this.groupPermissionsByModule();
        }
      },
      error: (error) => {
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

    // Create grouped permissions for the new template
    this.groupedRolePermissions = [];
    const moduleMap = new Map<string, GroupedPermissions>();

    this.userRole.permissions.forEach((perm: any) => {
      const moduleSlug = perm.module_slug || perm.module || 'general';
      const moduleName = perm.module_name || this.getModuleDisplayName(moduleSlug);
      
      if (!moduleMap.has(moduleSlug)) {
        moduleMap.set(moduleSlug, {
          module_name: moduleName,
          module_slug: moduleSlug,
          module_icon: this.getModuleIcon(moduleSlug),
          permissions: []
        });
      }
      
      moduleMap.get(moduleSlug)?.permissions.push(perm);
    });

    this.groupedRolePermissions = Array.from(moduleMap.values());
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

  getTotalPermissionsCount(): number {
    let count = 0;
    if (this.userRole && this.userRole.permissions) {
      count += this.userRole.permissions.length;
    }
    if (this.userPermissions) {
      count += this.userPermissions.length;
    }
    return count;
  }
}

