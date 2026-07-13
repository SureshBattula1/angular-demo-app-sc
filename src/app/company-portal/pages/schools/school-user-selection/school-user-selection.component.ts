import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { CompanySchoolService } from '../../../services/school.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ImpersonationService } from '../../../services/impersonation.service';
import { Router } from '@angular/router';
import { User } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

export interface SchoolUserSelectionData {
  schoolId: string | number;
  schoolName: string;
}

@Component({
  selector: 'app-school-user-selection',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './school-user-selection.component.html',
  styleUrl: './school-user-selection.component.scss'
})
export class SchoolUserSelectionComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  allUsers: User[] = []; // Store all users for client-side filtering
  loading = false;
  selectedUser: User | null = null;
  impersonating = false;

  // Search and filter controls
  searchControl = new FormControl('');
  roleFilterControl = new FormControl('');

  // Available roles
  availableRoles: Array<{ value: string; label: string }> = [
    { value: '', label: 'All Roles' },
    { value: 'Admin', label: 'Admin' },
    { value: 'SuperAdmin', label: 'Super Admin' },
    { value: 'Teacher', label: 'Teacher' },
    { value: 'Staff', label: 'Staff' }
  ];

  constructor(
    public dialogRef: MatDialogRef<SchoolUserSelectionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SchoolUserSelectionData,
    private schoolService: CompanySchoolService,
    private impersonationService: ImpersonationService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.setupFilters();
  }

  setupFilters(): void {
    // Search filter with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });

    // Role filter
    this.roleFilterControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let filtered = [...this.allUsers];

    // Apply role filter
    const selectedRole = this.roleFilterControl.value;
    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Apply search filter
    const searchQuery = this.searchControl.value?.toLowerCase().trim() || '';
    if (searchQuery) {
      filtered = filtered.filter(user => {
        const fullName = (user.full_name || `${user.first_name} ${user.last_name}`).toLowerCase();
        const email = (user.email || '').toLowerCase();
        const role = (user.role || '').toLowerCase();
        const branchName = (user.branch?.name || '').toLowerCase();

        return fullName.includes(searchQuery) ||
          email.includes(searchQuery) ||
          role.includes(searchQuery) ||
          branchName.includes(searchQuery);
      });
    }

    this.filteredUsers = filtered;
  }

  loadUsers(): void {
    this.loading = true;
    this.schoolService.getSchoolUsers(this.data.schoolId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allUsers = response.data;
          this.filteredUsers = response.data;
          this.users = response.data; // Keep for backward compatibility
        } else {
          this.allUsers = [];
          this.filteredUsers = [];
          this.users = [];
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.allUsers = [];
        this.filteredUsers = [];
        this.users = [];
      }
    });
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.impersonateUser(user);
  }

  impersonateUser(user: User): void {
    this.impersonating = true;

    this.impersonationService.startImpersonation(user.id, `Accessing school: ${this.data.schoolName}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Store impersonation token
          const impersonationToken = response.data.impersonation_token;
          const impersonatedUserData = response.data.impersonated_user;

          if (impersonationToken) {
            // Store company portal token before switching
            const companyPortalToken = localStorage.getItem('company_portal_token');
            if (companyPortalToken) {
              localStorage.setItem('company_portal_token_backup', companyPortalToken);
            }

            // Store impersonation token
            localStorage.setItem('impersonation_token', impersonationToken);

            // Set flag to indicate we're in impersonation mode
            localStorage.setItem('is_impersonating', 'true');

            // Switch to school auth context - set token first
            localStorage.setItem('auth_token', impersonationToken);

            // If we have user data from response, use it; otherwise fetch it
            if (impersonatedUserData) {
              // Map the impersonated user data to User interface
              const impersonatedUser: User = {
                id: impersonatedUserData.id,
                first_name: impersonatedUserData.first_name,
                last_name: impersonatedUserData.last_name,
                email: impersonatedUserData.email,
                role: impersonatedUserData.role as any,
                branch_id: impersonatedUserData.branch_id || user.branch_id,
                branch: impersonatedUserData.branch || user.branch,
                is_active: impersonatedUserData.is_active !== undefined ? impersonatedUserData.is_active : true,
                full_name: impersonatedUserData.full_name || `${impersonatedUserData.first_name} ${impersonatedUserData.last_name}`
              };

              // Store the impersonated user data
              localStorage.setItem('current_user', JSON.stringify(impersonatedUser));

              // Clear any company portal user data to avoid conflicts
              localStorage.removeItem('company_portal_user');

              // Immediately force full page reload to switch to school app
              // Don't wait for dialog to close - page reload will destroy it
              window.location.replace('/dashboard');
            } else {
              // Fetch the impersonated user's data using the new token
              this.apiService.get<User>('/me').subscribe({
                next: (userResponse) => {
                  if (userResponse.success && userResponse.data) {
                    // Store the impersonated user data
                    const impersonatedUser = userResponse.data;
                    localStorage.setItem('current_user', JSON.stringify(impersonatedUser));

                    // Immediately redirect - page reload will close dialog
                    window.location.replace('/dashboard');
                  } else {
                    // If user fetch fails, still try to redirect (user might be loaded on reload)
                    window.location.replace('/dashboard');
                  }
                },
                error: (userError) => {
                  // Even if user fetch fails, redirect and let the page reload handle it
                  console.error('Failed to fetch impersonated user:', userError);
                  window.location.replace('/dashboard');
                }
              });
            }
          } else {
            this.errorHandler.showError('Failed to get impersonation token');
            this.impersonating = false;
          }
        } else {
          this.errorHandler.showError(response.message || 'Failed to start impersonation');
          this.impersonating = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.impersonating = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getRoleIcon(role?: string): string {
    switch (role) {
      case 'Admin':
        return 'admin_panel_settings';
      case 'SuperAdmin':
        return 'supervisor_account';
      case 'Teacher':
        return 'person';
      case 'Staff':
        return 'badge';
      default:
        return 'account_circle';
    }
  }

  getRoleColor(role?: string): string {
    switch (role) {
      case 'Admin':
        return 'primary';
      case 'SuperAdmin':
        return 'accent';
      case 'Teacher':
        return 'primary';
      case 'Staff':
        return '';
      default:
        return '';
    }
  }

  isBranchAdmin(user: User): boolean {
    return user.role === 'Admin';
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.roleFilterControl.setValue('');
    this.applyFilters();
  }
}

