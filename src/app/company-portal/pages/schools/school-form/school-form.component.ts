import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { CompanySchoolService } from '../../../services/school.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { School } from '../../../../core/models/school.model';

@Component({
  selector: 'app-school-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './school-form.component.html',
  styleUrl: './school-form.component.scss'
})
export class SchoolFormComponent implements OnInit {
  schoolForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  schoolId?: number;
  currentSchool?: School;

  // Dropdown options
  statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Suspended', label: 'Suspended' },
    { value: 'UnderConstruction', label: 'Under Construction' }
  ];

  adminRoleOptions = [
    { value: 'BranchAdmin', label: 'Branch Admin' },
    { value: 'SuperAdmin', label: 'Super Admin' }
  ];

  constructor(
    private fb: FormBuilder,
    private schoolService: CompanySchoolService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.schoolId = +params['id'];
        this.isEditMode = this.router.url.includes('/edit');
        if (this.isEditMode) {
          // In edit mode, make password optional (user can leave blank to keep current password)
          this.schoolForm.get('admin_user.password')?.clearValidators();
          this.schoolForm.get('admin_user.password')?.setValidators([Validators.minLength(8)]);
          this.schoolForm.get('admin_user.password')?.updateValueAndValidity();
          this.loadSchool(this.schoolId);
        } else {
          // In create mode, password is required
          this.schoolForm.get('admin_user.password')?.setValidators([Validators.required, Validators.minLength(8)]);
          this.schoolForm.get('admin_user.password')?.updateValueAndValidity();
        }
      } else {
        // Create mode - password is required
        this.schoolForm.get('admin_user.password')?.setValidators([Validators.required, Validators.minLength(8)]);
        this.schoolForm.get('admin_user.password')?.updateValueAndValidity();
      }
    });
  }

  private initForm(): void {
    this.schoolForm = this.fb.group({
      // Basic Information
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],

      // Status
      status: ['Active', Validators.required],

      // Branch Information (required for new schools)
      branch: this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        code: ['', [Validators.required, Validators.maxLength(50)]],
        address: ['', [Validators.required, Validators.maxLength(500)]],
        city: ['', [Validators.required, Validators.maxLength(100)]],
        state: ['', [Validators.required, Validators.maxLength(100)]],
        country: ['', [Validators.required, Validators.maxLength(100)]],
        pincode: ['', [Validators.required, Validators.maxLength(10)]],
        phone: ['', [Validators.required, Validators.maxLength(20)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        website: ['', [Validators.maxLength(255)]]
      }),

      // Admin User Information (required for new schools)
      admin_user: this.fb.group({
        first_name: ['', [Validators.required, Validators.maxLength(255)]],
        last_name: ['', [Validators.required, Validators.maxLength(255)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        password: ['', [Validators.minLength(8)]], // Required only for new schools, optional for edit
        phone: ['', [Validators.maxLength(20)]],
        role: ['BranchAdmin', [Validators.required]]
      })
    });
  }

  private loadSchool(id: number): void {
    this.isLoading = true;

    this.schoolService.getSchool(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentSchool = response.data;
          const school = response.data;

          // Patch basic school info
          this.schoolForm.patchValue({
            name: school.name,
            code: school.code,
            status: school.status
          });

          // Patch branch info if mainBranch exists
          if (school.main_branch) {
            const branch = school.main_branch;
            this.schoolForm.get('branch')?.patchValue({
              name: branch.name || '',
              code: branch.code || '',
              address: branch.address || '',
              city: branch.city || '',
              state: branch.state || '',
              country: branch.country || '',
              pincode: branch.pincode || '',
              phone: branch.phone || '',
              email: branch.email || '',
              website: branch.website || ''
            });
          }

          // Patch admin user info if admin_user exists
          if (school.admin_user) {
            const adminUser = school.admin_user;
            this.schoolForm.get('admin_user')?.patchValue({
              first_name: adminUser.first_name || '',
              last_name: adminUser.last_name || '',
              email: adminUser.email || '',
              phone: adminUser.phone || '',
              role: adminUser.role || 'BranchAdmin'
              // Don't patch password - leave it empty for user to change if needed
            });
          }

          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/company-portal/schools']);
      }
    });
  }

  onSubmit(): void {
    if (this.schoolForm.invalid) {
      this.markFormGroupTouched(this.schoolForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = { ...this.schoolForm.value };

    // For edit mode, remove password if it's empty (user doesn't want to change it)
    if (this.isEditMode && formData.admin_user && !formData.admin_user.password) {
      delete formData.admin_user.password;
    }

    const request = this.isEditMode && this.schoolId
      ? this.schoolService.updateSchool(this.schoolId, formData)
      : this.schoolService.createSchool(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          const message = this.isEditMode
            ? 'School updated successfully'
            : 'School created successfully with main branch and admin user';
          this.errorHandler.showSuccess(message);
          this.router.navigate(['/company-portal/schools']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/company-portal/schools']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    // Handle nested form groups (branch.*, admin_user.*)
    const parts = fieldName.split('.');
    let control = this.schoolForm;

    for (const part of parts) {
      control = control.get(part) as any;
      if (!control) break;
    }

    if (!control) return '';

    if (control.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength')?.requiredLength;
      return `Minimum ${minLength} characters required`;
    }

    if (control.hasError('pattern')) {
      return `Invalid ${this.getFieldLabel(fieldName)} format`;
    }

    if (control.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }

    if (control.hasError('serverError')) {
      return control.getError('serverError');
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'School Name',
      code: 'School Code',
      status: 'Status',
      'branch.name': 'Branch Name',
      'branch.code': 'Branch Code',
      'branch.address': 'Address',
      'branch.city': 'City',
      'branch.state': 'State',
      'branch.country': 'Country',
      'branch.pincode': 'Pincode',
      'branch.phone': 'Phone',
      'branch.email': 'Email',
      'branch.website': 'Website',
      'admin_user.first_name': 'First Name',
      'admin_user.last_name': 'Last Name',
      'admin_user.email': 'Email',
      'admin_user.password': 'Password',
      'admin_user.phone': 'Phone',
      'admin_user.role': 'Role'
    };
    return labels[fieldName] || fieldName;
  }

  getBranchForm(): FormGroup {
    return this.schoolForm.get('branch') as FormGroup;
  }

  getAdminUserForm(): FormGroup {
    return this.schoolForm.get('admin_user') as FormGroup;
  }
}
