import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { GradeService } from '../../services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Grade } from '../../../../core/models/grade.model';

@Component({
  selector: 'app-grade-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './grade-form.component.html',
  styleUrls: ['./grade-form.component.scss']
})
export class GradeFormComponent implements OnInit {
  gradeForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  gradeValue?: string;
  currentGrade?: Grade;
  
  // Grade options (1-12)
  gradeOptions = [
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
    { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' },
    { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' }
  ];

  constructor(
    private fb: FormBuilder,
    private gradeService: GradeService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.gradeValue = params['id'];
        this.isEditMode = true;
        if (this.gradeValue) {
          this.loadGrade(this.gradeValue);
        }
      }
    });
  }

  private initForm(): void {
    this.gradeForm = this.fb.group({
      // Basic Information
      value: ['', [Validators.required, Validators.pattern(/^[0-9]{1,2}$/)]],
      label: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      
      // Status
      is_active: [true]
    });
  }

  private loadGrade(gradeValue: string): void {
    this.isLoading = true;
    
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const grade = response.data.find(g => g.value === gradeValue);
          if (grade) {
            this.currentGrade = grade;
            this.gradeForm.patchValue({
              value: grade.value,
              label: grade.label,
              description: grade.description,
              is_active: grade.is_active
            });
            // Make value readonly in edit mode
            this.gradeForm.get('value')?.disable();
          }
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/grades']);
      }
    });
  }

  onSubmit(): void {
    if (this.gradeForm.invalid) {
      this.markFormGroupTouched(this.gradeForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.gradeForm.getRawValue(); // getRawValue includes disabled fields

    const request = this.isEditMode && this.gradeValue
      ? this.gradeService.updateGrade(this.gradeValue, formData)
      : this.gradeService.createGrade(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Grade updated successfully' : 'Grade created successfully'
          );
          this.router.navigate(['/grades']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/grades']);
  }

  onGradeChange(event: any): void {
    const selectedValue = event.value;
    const selectedGrade = this.gradeOptions.find(g => g.value === selectedValue);
    if (selectedGrade && !this.isEditMode) {
      this.gradeForm.patchValue({
        label: selectedGrade.label
      });
    }
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
    const control = this.gradeForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('pattern')) {
      return `Invalid ${this.getFieldLabel(fieldName)} format`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      value: 'Grade Number',
      label: 'Grade Label',
      description: 'Description'
    };
    return labels[fieldName] || fieldName;
  }
}

