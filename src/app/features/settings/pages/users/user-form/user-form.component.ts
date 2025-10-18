import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { BranchService } from '../../../../branches/services/branch.service';
import { User } from '../../../../../core/models/user.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, ReactiveFormsModule],
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
        console.error('Error loading branches:', error);
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
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
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
          this.errorHandler.showSuccess(
            this.isEditMode ? 'User updated successfully' : 'User created successfully'
          );
          this.router.navigate(['/settings/users']);
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
    this.router.navigate(['/settings/users']);
  }
}

