import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TeacherService } from '../../services/teacher.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Teacher } from '../../../../core/models/teacher.model';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './teacher-form.component.html',
  styleUrls: ['./teacher-form.component.scss']
})
export class TeacherFormComponent implements OnInit {
  teacherForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  teacherId?: number;
  currentTeacher?: Teacher;
  
  branches: any[] = [];

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.teacherId = +params['id'];
        this.isEditMode = true;
        this.loadTeacher(this.teacherId);
      }
    });
  }

  private initForm(): void {
    this.teacherForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.maxLength(255)]],
      last_name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      branch_id: [null, Validators.required],
      is_active: [true]
    });
  }

  private loadTeacher(id: number): void {
    this.isLoading = true;
    
    this.teacherService.getTeacher(id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.currentTeacher = response.data;
          this.teacherForm.patchValue(response.data);
          // Remove password requirement for edit mode
          this.teacherForm.get('password')?.clearValidators();
          this.teacherForm.get('password')?.updateValueAndValidity();
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/teachers']);
      }
    });
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.branches = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.teacherForm.invalid) {
      this.markFormGroupTouched(this.teacherForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = { ...this.teacherForm.value };
    
    // Remove password if empty in edit mode
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }

    const request = this.isEditMode && this.teacherId
      ? this.teacherService.updateTeacher(this.teacherId, formData)
      : this.teacherService.createTeacher(formData);

    request.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Teacher updated successfully' : 'Teacher created successfully'
          );
          this.router.navigate(['/teachers']);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/teachers']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      password: 'Password',
      branch_id: 'Branch'
    };
    return labels[fieldName] || fieldName;
  }
  
  getErrorMessage(fieldName: string): string {
    const control = this.teacherForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    return '';
  }
}

