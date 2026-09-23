import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { CompanySchoolService } from '../../../services/school.service';
import { CompanyService } from '../../../services/company.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { School, Company } from '../../../../core/models/school.model';

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
  schoolId?: string;
  currentSchool?: School;

  companies: Company[] = [];
  companiesLoading = false;

  // Dropdown options
  statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Suspended', label: 'Suspended' },
    { value: 'UnderConstruction', label: 'Under Construction' }
  ];

  hideBranchAdminPassword = true;

  constructor(
    private fb: FormBuilder,
    private schoolService: CompanySchoolService,
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Load companies for dropdown (current company for company admins)
    this.loadCompanies();

    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.schoolId = params['id'];
        this.isEditMode = this.router.url.includes('/edit');
        if (this.isEditMode) {
          this.setPasswordValidators(false);
          this.loadSchool(this.schoolId!);
        } else {
          this.setPasswordValidators(true);
        }
      } else {
        this.setPasswordValidators(true);
      }
    });
  }

  private initForm(): void {
    this.schoolForm = this.fb.group({
      // Basic Information
      company_id: [null, [Validators.required]],
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
        website: ['', [Validators.maxLength(255)]],
        principal_name: ['', [Validators.required, Validators.maxLength(255)]],
        principal_contact: ['', [Validators.required, Validators.maxLength(20)]],
        principal_email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        branch_admin_password: ['', [Validators.minLength(8)]]
      }),

      // Super Admin login (required for new schools)
      admin_user: this.fb.group({
        first_name: ['', [Validators.required, Validators.maxLength(255)]],
        last_name: ['', [Validators.required, Validators.maxLength(255)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        password: ['', [Validators.minLength(8)]],
        phone: ['', [Validators.maxLength(20)]],
        role: [{ value: 'SuperAdmin', disabled: true }]
      })
    }, { validators: this.distinctAdminEmails });
  }

  private setPasswordValidators(required: boolean): void {
    const adminPassword = this.schoolForm.get('admin_user.password');
    const branchPassword = this.schoolForm.get('branch.branch_admin_password');
    const rules = required
      ? [Validators.required, Validators.minLength(8)]
      : [Validators.minLength(8)];

    adminPassword?.setValidators(rules);
    branchPassword?.setValidators(rules);
    adminPassword?.updateValueAndValidity();
    branchPassword?.updateValueAndValidity();
  }

  private distinctAdminEmails = (group: AbstractControl): ValidationErrors | null => {
    const adminEmail = group.get('admin_user.email')?.value?.toString().trim().toLowerCase();
    const principalEmail = group.get('branch.principal_email')?.value?.toString().trim().toLowerCase();
    if (adminEmail && principalEmail && adminEmail === principalEmail) {
      return { emailsMatch: true };
    }
    return null;
  };

  private loadCompanies(): void {
    this.companiesLoading = true;

    // Fetch companies; for CompanyAdmin this should normally return only their company
    this.companyService.getCompanies({ per_page: 1000 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.companies = response.data;

          // In create mode, if there's exactly one company, pre-select it
          if (!this.isEditMode && this.companies.length === 1) {
            this.schoolForm.get('company_id')?.setValue(this.companies[0].id);
          }
        }
        this.companiesLoading = false;
      },
      error: (error) => {
        // If companies fail to load, surface error – creation depends on this
        this.errorHandler.showError(error);
        this.companiesLoading = false;
      }
    });
  }

  private loadSchool(id: string): void {
    this.isLoading = true;

    this.schoolService.getSchool(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentSchool = response.data;
          const school = response.data;

          // Patch basic school info
          this.schoolForm.patchValue({
            company_id: school.company?.id ?? null,
            name: school.name,
            code: school.code,
            status: school.status
          });

          // In edit mode, prevent changing the company
          if (school.company?.id) {
            this.schoolForm.get('company_id')?.disable({ emitEvent: false });
          }

          const branch = school.main_branch ?? (school as School & { mainBranch?: School['main_branch'] }).mainBranch;
          if (branch) {
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
              website: branch.website || '',
              principal_name: branch.principal_name || '',
              principal_contact: branch.principal_contact || '',
              principal_email: branch.principal_email || school.branch_admin?.email || ''
            });
          }

          if (school.admin_user) {
            const adminUser = school.admin_user;
            this.schoolForm.get('admin_user')?.patchValue({
              first_name: adminUser.first_name || '',
              last_name: adminUser.last_name || '',
              email: adminUser.email || '',
              phone: adminUser.phone || '',
              role: 'SuperAdmin'
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
    // Use getRawValue so disabled controls (like company_id in edit mode) are included
    const formData = this.schoolForm.getRawValue();

    if (formData.admin_user) {
      formData.admin_user.role = 'SuperAdmin';
    }
    if (this.isEditMode) {
      if (formData.admin_user && !formData.admin_user.password) {
        delete formData.admin_user.password;
      }
      if (formData.branch && !formData.branch.branch_admin_password) {
        delete formData.branch.branch_admin_password;
      }
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
            : 'School created successfully with Super Admin and Branch Admin';
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

    if (this.schoolForm.hasError('emailsMatch') && (fieldName === 'branch.principal_email' || fieldName === 'admin_user.email')) {
      return 'Branch Admin email must be different from Super Admin email';
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      company_id: 'Company',
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
      'branch.phone': 'Branch Phone',
      'branch.email': 'Branch Office Email',
      'branch.website': 'Website',
      'branch.principal_name': 'Principal Name',
      'branch.principal_contact': 'Principal Contact',
      'branch.principal_email': 'Branch Admin Email',
      'branch.branch_admin_password': 'Branch Admin Password',
      'admin_user.first_name': 'First Name',
      'admin_user.last_name': 'Last Name',
      'admin_user.email': 'Super Admin Email',
      'admin_user.password': 'Super Admin Password',
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
