import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { CompanyService } from '../../../services/company.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Company } from '../../../../core/models/school.model';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.scss'
})
export class CompanyFormComponent implements OnInit {
  companyForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  companyId?: number;
  currentCompany?: Company;

  statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Suspended', label: 'Suspended' }
  ];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.companyId = +params['id'];
        this.isEditMode = this.router.url.includes('/edit');
        if (this.isEditMode) {
          this.loadCompany(this.companyId);
        }
      }
    });
  }

  private initForm(): void {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      status: ['Active', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      website: ['', [Validators.maxLength(255)]],
      tax_id: ['', [Validators.maxLength(50)]],
      address: ['', [Validators.maxLength(500)]],
      city: ['', [Validators.maxLength(100)]],
      state: ['', [Validators.maxLength(100)]],
      country: ['', [Validators.maxLength(100)]],
      pincode: ['', [Validators.maxLength(20)]]
    });
  }

  private loadCompany(id: number): void {
    this.isLoading = true;

    this.companyService.getCompany(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentCompany = response.data;
          const company = response.data;
          this.companyForm.patchValue({
            name: company.name,
            code: company.code,
            status: company.status,
            email: company.email,
            phone: company.phone || '',
            website: company.website || '',
            tax_id: company.tax_id || '',
            address: company.address || '',
            city: company.city || '',
            state: company.state || '',
            country: company.country || '',
            pincode: company.pincode || ''
          });
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/company-portal/companies']);
      }
    });
  }

  onSubmit(): void {
    if (this.companyForm.invalid) {
      this.markFormGroupTouched(this.companyForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = { ...this.companyForm.value };

    const request = this.isEditMode && this.companyId
      ? this.companyService.updateCompany(this.companyId, formData)
      : this.companyService.createCompany(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          const message = this.isEditMode
            ? 'Company updated successfully'
            : 'Company created successfully';
          this.errorHandler.showSuccess(message);
          this.router.navigate(['/company-portal/companies']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/company-portal/companies']);
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
    const control = this.companyForm.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email address';
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
      name: 'Company Name',
      code: 'Company Code',
      status: 'Status',
      email: 'Email',
      phone: 'Phone',
      website: 'Website',
      tax_id: 'Tax ID',
      address: 'Address',
      city: 'City',
      state: 'State',
      country: 'Country',
      pincode: 'Pincode'
    };
    return labels[fieldName] || fieldName;
  }
}
