import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { UserService } from '../../../services/user.service';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { FormsModule } from '@angular/forms';

interface PermissionItem {
  id: number;
  name: string;
  slug: string;
  action: string;
  module_name: string;
  module_slug: string;
  module_icon: string;
  granted: boolean;
  from_role: boolean;
  overridden: boolean;
  modified?: boolean; // Track if user changed this permission
}

interface GroupedPermissions {
  module_name: string;
  module_slug: string;
  module_icon: string;
  module_order: number;
  permissions: PermissionItem[];
  allGranted?: boolean;
}

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule],
  templateUrl: './user-permissions.component.html',
  styleUrls: ['./user-permissions.component.scss']
})
export class UserPermissionsComponent implements OnInit {
  userId: number | null = null;
  userData: any = null;
  permissions: PermissionItem[] = [];
  groupedPermissions: GroupedPermissions[] = [];
  isLoading = false;
  isSaving = false;
  searchTerm = '';
  filterMode: 'all' | 'granted' | 'denied' | 'overridden' = 'all';
  expandedModules: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = parseInt(id, 10);
      this.loadUserPermissions();
    } else {
      this.errorHandler.showError('Invalid user ID');
      this.router.navigate(['/settings/users']);
    }
  }

  loadUserPermissions(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.userService.getUserPermissions(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.userData = response.data.user;
          this.permissions = response.data.permissions.map((p: any) => ({
            ...p,
            modified: false
          }));
          this.groupedPermissions = response.data.grouped_permissions;
          
          // Expand all modules by default
          this.groupedPermissions.forEach(group => {
            this.expandedModules.add(group.module_slug);
          });

          this.updateModuleStates();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
        this.router.navigate(['/settings/users']);
      }
    });
  }

  togglePermission(permission: PermissionItem): void {
    permission.granted = !permission.granted;
    permission.modified = true;
    permission.overridden = permission.granted !== permission.from_role;
    this.updateModuleStates();
  }

  toggleModule(module: GroupedPermissions): void {
    const newState = !this.areAllPermissionsGranted(module);
    module.permissions.forEach(perm => {
      perm.granted = newState;
      perm.modified = true;
      perm.overridden = perm.granted !== perm.from_role;
    });
    this.updateModuleStates();
  }

  toggleModuleExpanded(moduleSlug: string): void {
    if (this.expandedModules.has(moduleSlug)) {
      this.expandedModules.delete(moduleSlug);
    } else {
      this.expandedModules.add(moduleSlug);
    }
  }

  isModuleExpanded(moduleSlug: string): boolean {
    return this.expandedModules.has(moduleSlug);
  }

  areAllPermissionsGranted(module: GroupedPermissions): boolean {
    return module.permissions.every(p => p.granted);
  }

  areSomePermissionsGranted(module: GroupedPermissions): boolean {
    const grantedCount = module.permissions.filter(p => p.granted).length;
    return grantedCount > 0 && grantedCount < module.permissions.length;
  }

  updateModuleStates(): void {
    this.groupedPermissions.forEach(module => {
      module.allGranted = this.areAllPermissionsGranted(module);
    });
  }

  getFilteredGroupedPermissions(): GroupedPermissions[] {
    return this.groupedPermissions
      .map(module => ({
        ...module,
        permissions: module.permissions.filter(p => this.matchesFilter(p))
      }))
      .filter(module => module.permissions.length > 0);
  }

  matchesFilter(permission: PermissionItem): boolean {
    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      const matchesSearch = 
        permission.name.toLowerCase().includes(search) ||
        permission.module_name.toLowerCase().includes(search) ||
        permission.action.toLowerCase().includes(search);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (this.filterMode === 'granted' && !permission.granted) return false;
    if (this.filterMode === 'denied' && permission.granted) return false;
    if (this.filterMode === 'overridden' && !permission.overridden) return false;

    return true;
  }

  getModifiedPermissions(): PermissionItem[] {
    return this.permissions.filter(p => p.modified);
  }

  hasModifications(): boolean {
    return this.getModifiedPermissions().length > 0;
  }

  savePermissions(): void {
    if (!this.userId) return;

    const modifiedPermissions = this.getModifiedPermissions();
    
    if (modifiedPermissions.length === 0) {
      this.errorHandler.showError('No changes to save');
      return;
    }

    const permissionsToSave = modifiedPermissions.map(p => ({
      permission_id: p.id,
      granted: p.granted
    }));

    this.isSaving = true;
    this.userService.updateUserPermissions(this.userId, permissionsToSave).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Permissions updated successfully');
          this.loadUserPermissions(); // Reload to get fresh state
        }
        this.isSaving = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isSaving = false;
      }
    });
  }

  resetChanges(): void {
    this.loadUserPermissions();
  }

  goBack(): void {
    this.router.navigate(['/settings/users']);
  }

  getGrantedCount(module: GroupedPermissions): number {
    return module.permissions.filter(p => p.granted).length;
  }

  getOverriddenCount(module: GroupedPermissions): number {
    return module.permissions.filter(p => p.overridden).length;
  }

  expandAll(): void {
    this.groupedPermissions.forEach(module => {
      this.expandedModules.add(module.module_slug);
    });
  }

  collapseAll(): void {
    this.expandedModules.clear();
  }

  getActionColor(action: string): string {
    const colorMap: { [key: string]: string } = {
      'view': 'primary',
      'create': 'accent',
      'edit': 'warn',
      'delete': 'danger',
      'export': 'info',
      'approve': 'success',
      'reject': 'danger'
    };
    return colorMap[action.toLowerCase()] || 'default';
  }
}

