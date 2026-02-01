import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CompanySchoolService } from '../../../services/school.service';
import { School } from '../../../../core/models/school.model';

@Component({
  selector: 'app-school-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './school-form.component.html',
  styleUrl: './school-form.component.scss'
})
export class SchoolFormComponent implements OnInit {
  schoolForm!: FormGroup;
  isEditMode = false;
  schoolId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Suspended', label: 'Suspended' },
    { value: 'UnderConstruction', label: 'Under Construction' }
  ];

  constructor(
    private fb: FormBuilder,
    private schoolService: CompanySchoolService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.schoolId = +params['id'];
        this.isEditMode = this.router.url.includes('/edit');
        this.loadSchool();
      }
    });
  }

  initForm(): void {
    this.schoolForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      status: ['Active', Validators.required],
      main_branch_id: [null]
    });
  }

  loadSchool(): void {
    if (!this.schoolId) return;

    this.isLoading = true;
    this.schoolService.getSchool(this.schoolId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const school = response.data;
          this.schoolForm.patchValue({
            name: school.name,
            code: school.code,
            status: school.status,
            main_branch_id: school.main_branch_id || null
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load school';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.schoolForm.invalid) {
      this.markFormGroupTouched(this.schoolForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = this.schoolForm.value;

    const request = this.isEditMode && this.schoolId
      ? this.schoolService.updateSchool(this.schoolId, formData)
      : this.schoolService.createSchool(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/company-portal/schools']);
        } else {
          this.errorMessage = response.message || 'Operation failed';
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred';
        if (error.error?.errors) {
          // Handle validation errors
          Object.keys(error.error.errors).forEach(key => {
            const control = this.schoolForm.get(key);
            if (control) {
              control.setErrors({ serverError: error.error.errors[key][0] });
            }
          });
        }
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/company-portal/schools']);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.schoolForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName} is required`;
    }
    if (control?.hasError('maxlength')) {
      return `${controlName} exceeds maximum length`;
    }
    if (control?.hasError('serverError')) {
      return control.getError('serverError');
    }
    return '';
  }
}
