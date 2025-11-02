import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { BranchService } from '../../../../branches/services/branch.service';
import { User } from '../../../../../core/models/user.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';

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
  modified?: boolean;
}

interface GroupedPermissions {
  module_name: string;
  module_slug: string;
  module_icon: string;
  module_order: number;
  permissions: PermissionItem[];
  allGranted?: boolean;
  expanded?: boolean;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  hidePassword = true;
  hideConfirmPassword = true;
  roles: any[] = [];
  branches: any[] = [];
  
  // Permission Management
  permissions: PermissionItem[] = [];
  groupedPermissions: GroupedPermissions[] = [];
  originalPermissions: PermissionItem[] = [];
  isLoadingPermissions = false;
  showPermissions = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {
    this.userForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: [''],
      password: [''],
      password_confirmation: [''],
      role_id: ['', Validators.required],
      branch_id: [''],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.userId = parseInt(id, 10);
    } else {
      // Password required for create
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('password_confirmation')?.setValidators([Validators.required]);
    }
    
    // Load roles and branches first, then load user data
    this.loadRoles();
    this.loadBranches();
  }

  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data;
          // Load user after roles are loaded (for edit mode)
          if (this.isEditMode && this.userId) {
            this.loadUser();
          }
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }

  loadBranches(): void {
    this.branchService.getBranches({}).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data || [];
        }
      },
      error: (error) => {
      }
    });
  }

  loadUser(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    this.userService.getUser(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          const user = response.data;
          
          // Find role_id if only role name is provided
          let roleId = user.role_id;
          if (!roleId && user.role && this.roles.length > 0) {
            const role = this.roles.find(r => r.name === user.role);
            roleId = role?.id;
          }
          
          this.userForm.patchValue({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            username: user.username,
            role_id: roleId,
            branch_id: user.branch_id,
            is_active: user.is_active ?? true
          });

          // Load permissions for edit mode
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

    this.isLoadingPermissions = true;
    this.userService.getUserPermissions(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          // Store all permissions
          this.permissions = response.data.permissions.map((p: any) => ({
            ...p,
            modified: false
          }));
          
          // Keep original copy for reset
          this.originalPermissions = JSON.parse(JSON.stringify(this.permissions));
          
          // Group permissions by module and ensure they reference the same objects
          this.groupedPermissions = response.data.grouped_permissions.map((g: any) => {
            // Map grouped permission IDs to the permissions array
            const modulePerms = g.permissions.map((gp: any) => {
              const perm = this.permissions.find(p => p.id === gp.id);
              return perm || gp;
            });
            
            return {
              ...g,
              permissions: modulePerms,
              expanded: false
            };
          });
          
          this.updateModuleStates();
          this.showPermissions = true;
        }
        this.isLoadingPermissions = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoadingPermissions = false;
      }
    });
  }

  togglePermission(permission: PermissionItem): void {
    // DON'T toggle here - ngModel already did it!
    // Just mark as modified and update override status
    
    permission.modified = true;
    
    // Mark as overridden if different from role permission
    permission.overridden = permission.granted !== permission.from_role;
    
    // Update module states
    this.updateModuleStates();
  }

  toggleModule(module: GroupedPermissions): void {
    // Toggle: if all are granted, disable all; otherwise enable all
    const newState = !this.areAllPermissionsGranted(module);
    
    module.permissions.forEach(perm => {
      if (perm.granted !== newState) {
        perm.granted = newState;
        perm.modified = true;
        perm.overridden = perm.granted !== perm.from_role;
      }
    });
    
    this.updateModuleStates();
    
    // Show feedback
    const action = newState ? 'granted' : 'revoked';
    this.errorHandler.showSuccess(`All ${module.module_name} permissions ${action}`);
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

  allowAllPermissions(): void {
    let count = 0;
    this.permissions.forEach(perm => {
      if (!perm.granted) {
        perm.granted = true;
        perm.modified = true;
        perm.overridden = !perm.from_role;
        count++;
      }
    });
    
    // Update grouped permissions as well
    this.groupedPermissions.forEach(module => {
      module.permissions.forEach(perm => {
        if (!perm.granted) {
          perm.granted = true;
          perm.modified = true;
          perm.overridden = !perm.from_role;
        }
      });
    });
    
    this.updateModuleStates();
    this.errorHandler.showSuccess(`${count} permissions granted`);
  }

  disableAllPermissions(): void {
    let count = 0;
    this.permissions.forEach(perm => {
      if (perm.granted) {
        perm.granted = false;
        perm.modified = true;
        perm.overridden = perm.from_role;
        count++;
      }
    });
    
    // Update grouped permissions as well
    this.groupedPermissions.forEach(module => {
      module.permissions.forEach(perm => {
        if (perm.granted) {
          perm.granted = false;
          perm.modified = true;
          perm.overridden = perm.from_role;
        }
      });
    });
    
    this.updateModuleStates();
    this.errorHandler.showSuccess(`${count} permissions revoked`);
  }

  resetPermissions(): void {
    // Reset all permissions to original state
    const originalMap = new Map(this.originalPermissions.map(p => [p.id, p]));
    
    this.permissions.forEach(perm => {
      const original = originalMap.get(perm.id);
      if (original) {
        perm.granted = original.granted;
        perm.from_role = original.from_role;
        perm.overridden = original.overridden;
        perm.modified = false;
      }
    });
    
    // Update grouped permissions as well
    this.groupedPermissions.forEach(module => {
      module.permissions.forEach(perm => {
        const original = originalMap.get(perm.id);
        if (original) {
          perm.granted = original.granted;
          perm.from_role = original.from_role;
          perm.overridden = original.overridden;
          perm.modified = false;
        }
      });
    });
    
    this.updateModuleStates();
    this.errorHandler.showSuccess('Permissions reset to original state');
  }

  getModifiedPermissions(): PermissionItem[] {
    return this.permissions.filter(p => p.modified);
  }

  hasPermissionModifications(): boolean {
    return this.getModifiedPermissions().length > 0;
  }

  getGrantedCount(module: GroupedPermissions): number {
    return module.permissions.filter(p => p.granted).length;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    // Check password confirmation
    const password = this.userForm.get('password')?.value;
    const passwordConfirmation = this.userForm.get('password_confirmation')?.value;
    
    if (password && password !== passwordConfirmation) {
      this.errorHandler.showError('Passwords do not match');
      return;
    }

    this.isSubmitting = true;
    const userData = this.userForm.value;

    // Remove password fields if empty (for edit mode)
    if (!userData.password) {
      delete userData.password;
      delete userData.password_confirmation;
    }

    const operation = this.isEditMode && this.userId
      ? this.userService.updateUser(this.userId, userData)
      : this.userService.createUser(userData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          // If in edit mode and permissions were modified, save them
          if (this.isEditMode && this.userId && this.hasPermissionModifications()) {
            this.savePermissions();
          } else {
            this.errorHandler.showSuccess(
              this.isEditMode ? 'User updated successfully' : 'User created successfully'
            );
            this.router.navigate(['/settings/users']);
            this.isSubmitting = false;
          }
        } else {
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isSubmitting = false;
      }
    });
  }

  savePermissions(): void {
    if (!this.userId) return;

    const modifiedPermissions = this.getModifiedPermissions();
    


    
    // Build list of all permissions that need user-specific overrides
    // We need to send ALL overrides (both old and new) because backend deletes all first
    const permissionsToSave: any[] = [];
    
    this.permissions.forEach(p => {
      // Compare current state with original to see if this needs an override
      const original = this.originalPermissions.find(op => op.id === p.id);
      
      // Save if:
      // 1. Permission state is different from role (override needed)
      // 2. OR permission was already overridden and still different from role
      // 3. OR permission was modified
      const isDifferentFromRole = p.granted !== p.from_role;
      const wasOverridden = original?.overridden || false;
      const isModified = p.modified || false;
      
      if (isDifferentFromRole || wasOverridden || isModified) {
        permissionsToSave.push({
          permission_id: p.id,
          granted: p.granted  // Can be true (grant) or false (deny)
        });
      }
    });

    // If no permissions to save and no modifications, just finish
    if (permissionsToSave.length === 0 && modifiedPermissions.length === 0) {
      this.errorHandler.showSuccess('User updated successfully');
      this.router.navigate(['/settings/users']);
      this.isSubmitting = false;
      return;
    }


    this.userService.updateUserPermissions(this.userId, permissionsToSave).subscribe({
      next: (response) => {

        if (response.success) {
          this.errorHandler.showSuccess(`User and ${permissionsToSave.length} permissions updated successfully`);
          this.router.navigate(['/settings/users']);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Save error:', error);
        this.errorHandler.handleError(error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/settings/users']);
  }
}

