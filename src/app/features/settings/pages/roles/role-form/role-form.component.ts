import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { RoleService } from '../../../services/role.service';
import { PermissionService as SettingsPermissionService } from '../../../services/permission.service';
import { Role, Permission } from '../../../../../core/models/role.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss']
})
export class RoleFormComponent implements OnInit {
  roleForm: FormGroup;
  isEditMode = false;
  roleId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  allPermissions: Permission[] = [];
  selectedPermissionIds: number[] = [];
  permissionsByModule: Record<string, Permission[]> = {};

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private permissionService: SettingsPermissionService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadPermissions();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.roleId = parseInt(id, 10);
      this.loadRole();
    }
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (response) => {
        if (response.success) {
          this.allPermissions = response.data;
          this.groupPermissionsByModule();
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }

  groupPermissionsByModule(): void {
    this.permissionsByModule = {};
    this.allPermissions.forEach(permission => {
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
   */
  getModuleDisplayName(moduleKey: string): string {
    if (!moduleKey) return 'General';
    
    return moduleKey
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get icon for module
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

  loadRole(): void {
    if (!this.roleId) return;
    
    this.isLoading = true;
    this.roleService.getRole(this.roleId).subscribe({
      next: (response) => {
        if (response.success) {
          const role = response.data;
          this.roleForm.patchValue({
            name: role.name,
            description: role.description
          });
          
          if (role.permissions) {
            this.selectedPermissionIds = role.permissions.map(p => p.id);
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

  togglePermission(permissionId: number): void {
    const index = this.selectedPermissionIds.indexOf(permissionId);
    if (index > -1) {
      this.selectedPermissionIds.splice(index, 1);
    } else {
      this.selectedPermissionIds.push(permissionId);
    }
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.selectedPermissionIds.includes(permissionId);
  }

  selectAllInModule(module: string): void {
    const modulePermissions = this.permissionsByModule[module];
    const allSelected = modulePermissions.every(p => this.isPermissionSelected(p.id));
    
    if (allSelected) {
      // Deselect all in this module
      modulePermissions.forEach(p => {
        const index = this.selectedPermissionIds.indexOf(p.id);
        if (index > -1) {
          this.selectedPermissionIds.splice(index, 1);
        }
      });
    } else {
      // Select all in this module
      modulePermissions.forEach(p => {
        if (!this.isPermissionSelected(p.id)) {
          this.selectedPermissionIds.push(p.id);
        }
      });
    }
  }

  areAllModulePermissionsSelected(module: string): boolean {
    const modulePermissions = this.permissionsByModule[module];
    return modulePermissions.every(p => this.isPermissionSelected(p.id));
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;
    const roleData = this.roleForm.value;

    const operation = this.isEditMode && this.roleId
      ? this.roleService.updateRole(this.roleId, roleData)
      : this.roleService.createRole(roleData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          // Assign permissions
          const roleId = this.isEditMode && this.roleId ? this.roleId : response.data.id;
          this.assignPermissions(roleId);
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isSubmitting = false;
      }
    });
  }

  assignPermissions(roleId: number): void {
    this.roleService.assignPermissions(roleId, this.selectedPermissionIds).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Role updated successfully' : 'Role created successfully'
          );
          this.router.navigate(['/settings/roles']);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/settings/roles']);
  }
}

