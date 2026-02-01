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
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface SchoolUserSelectionData {
  schoolId: number;
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
    { value: 'BranchAdmin', label: 'Branch Admin' },
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
    private router: Router
  ) {}

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
          if (impersonationToken) {
            // Store company portal token before switching
            const companyPortalToken = localStorage.getItem('company_portal_token');
            if (companyPortalToken) {
              localStorage.setItem('company_portal_token_backup', companyPortalToken);
            }
            
            // Store impersonation token
            localStorage.setItem('impersonation_token', impersonationToken);
            
            // Switch to school auth context
            localStorage.setItem('auth_token', impersonationToken);
            
            // Close dialog
            this.dialogRef.close();
            
            // Redirect to school dashboard
            this.router.navigate(['/dashboard']).then(() => {
              // Reload the page to refresh auth context
              window.location.reload();
            });
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
      case 'BranchAdmin':
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
      case 'BranchAdmin':
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
    return user.role === 'BranchAdmin';
  }
  
  clearFilters(): void {
    this.searchControl.setValue('');
    this.roleFilterControl.setValue('');
    this.applyFilters();
  }
}

