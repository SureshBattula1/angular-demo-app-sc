import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { RoleService } from '../../../services/role.service';
import { Role, Permission } from '../../../../../core/models/role.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-role-view',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, HasPermissionDirective],
  templateUrl: './role-view.component.html',
  styleUrls: ['./role-view.component.scss']
})
export class RoleViewComponent implements OnInit {
  role: Role | null = null;
  roleId: number | null = null;
  isLoading = false;
  permissionsByModule: Record<string, Permission[]> = {};

  constructor(
    private roleService: RoleService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.roleId = parseInt(id, 10);
      this.loadRole();
    }
  }

  loadRole(): void {
    if (!this.roleId) return;
    
    this.isLoading = true;
    this.roleService.getRole(this.roleId).subscribe({
      next: (response) => {
        if (response.success) {
          this.role = response.data;
          this.groupPermissionsByModule();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
  }

  groupPermissionsByModule(): void {
    if (!this.role?.permissions) return;
    
    this.permissionsByModule = {};
    this.role.permissions.forEach(permission => {
      // Use module field from permission, default to 'General' if not specified
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

  /**
   * Format module name for display
   * Converts module key to readable format
   * e.g., 'students' -> 'Students', 'fee_management' -> 'Fee Management'
   */
  getModuleDisplayName(moduleKey: string): string {
    if (!moduleKey) return 'General';
    
    // Convert snake_case or kebab-case to Title Case
    return moduleKey
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get icon for module based on module name
   */
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
      'fee_management': 'payments',
      'accounts': 'account_balance',
      'transactions': 'receipt_long',
      'invoices': 'receipt',
      'holidays': 'event',
      'exams': 'quiz',
      'library': 'local_library',
      'books': 'menu_book',
      'transport': 'directions_bus',
      'events': 'event_note',
      'timetables': 'schedule',
      'roles': 'admin_panel_settings',
      'permissions': 'shield',
      'users': 'people',
      'settings': 'settings',
      'reports': 'assessment',
      'general': 'folder'
    };

    return iconMap[moduleKey.toLowerCase()] || 'folder_special';
  }

  editRole(): void {
    if (this.roleId) {
      this.router.navigate(['/settings/roles/edit', this.roleId]);
    }
  }

  deleteRole(): void {
    if (!this.role) return;
    
    if (confirm(`Are you sure you want to delete the role "${this.role.name}"?`)) {
      this.roleService.deleteRole(this.role.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Role deleted successfully');
            this.router.navigate(['/settings/roles']);
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/settings/roles']);
  }
}

