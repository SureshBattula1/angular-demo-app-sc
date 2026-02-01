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
  
  mainBranches: Array<{ id: number; name: string; code: string }> = [];

  constructor(
    private fb: FormBuilder,
    private schoolService: CompanySchoolService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMainBranches();
    
    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.schoolId = +params['id'];
        this.isEditMode = this.router.url.includes('/edit');
        if (this.isEditMode) {
          this.loadSchool(this.schoolId);
        }
      }
    });
  }

  private initForm(): void {
    this.schoolForm = this.fb.group({
      // Basic Information
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      main_branch_id: [null],
      
      // Status
      status: ['Active', Validators.required]
    });
  }

  private loadSchool(id: number): void {
    this.isLoading = true;
    
    this.schoolService.getSchool(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentSchool = response.data;
          this.schoolForm.patchValue({
            name: response.data.name,
            code: response.data.code,
            main_branch_id: response.data.main_branch_id || null,
            status: response.data.status
          });
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

  private loadMainBranches(): void {
    // Load branches that could be main branches
    // This would need a service method to get branches
    // For now, we'll leave it empty or implement if needed
    this.mainBranches = [];
  }

  onSubmit(): void {
    if (this.schoolForm.invalid) {
      this.markFormGroupTouched(this.schoolForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = { ...this.schoolForm.value };
    
    // Remove main_branch_id if null or empty
    if (!formData.main_branch_id || formData.main_branch_id === '') {
      delete formData.main_branch_id;
    }

    const request = this.isEditMode && this.schoolId
      ? this.schoolService.updateSchool(this.schoolId, formData)
      : this.schoolService.createSchool(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'School updated successfully' : 'School created successfully'
          );
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
    const control = this.schoolForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control?.hasError('pattern')) {
      return `Invalid ${this.getFieldLabel(fieldName)} format`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    if (control?.hasError('serverError')) {
      return control.getError('serverError');
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'School Name',
      code: 'School Code',
      status: 'Status',
      main_branch_id: 'Main Branch'
    };
    return labels[fieldName] || fieldName;
  }
}
