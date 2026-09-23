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
  branchId?: number;
  
  // Predefined grade options
  gradeValueOptions = [
    // Pre-Primary
    { value: 'PlaySchool', label: 'Play School', category: 'Pre-Primary', order: 1 },
    { value: 'Nursery', label: 'Nursery', category: 'Pre-Primary', order: 2 },
    { value: 'LKG', label: 'Lower Kindergarten (LKG)', category: 'Pre-Primary', order: 3 },
    { value: 'UKG', label: 'Upper Kindergarten (UKG)', category: 'Pre-Primary', order: 4 },
    // Primary
    { value: '1', label: 'Grade 1', category: 'Primary', order: 5 },
    { value: '2', label: 'Grade 2', category: 'Primary', order: 6 },
    { value: '3', label: 'Grade 3', category: 'Primary', order: 7 },
    { value: '4', label: 'Grade 4', category: 'Primary', order: 8 },
    { value: '5', label: 'Grade 5', category: 'Primary', order: 9 },
    // Middle
    { value: '6', label: 'Grade 6', category: 'Middle', order: 10 },
    { value: '7', label: 'Grade 7', category: 'Middle', order: 11 },
    { value: '8', label: 'Grade 8', category: 'Middle', order: 12 },
    // Secondary
    { value: '9', label: 'Grade 9', category: 'Secondary', order: 13 },
    { value: '10', label: 'Grade 10', category: 'Secondary', order: 14 },
    // Senior-Secondary
    { value: '11', label: 'Grade 11', category: 'Senior-Secondary', order: 15 },
    { value: '12', label: 'Grade 12', category: 'Senior-Secondary', order: 16 },
    // Custom option
    { value: 'custom', label: '✏️ Custom Grade (Enter Manually)', category: '', order: 99 }
  ];

  // Grade categories
  categoryOptions = [
    { value: 'Pre-Primary', label: 'Pre-Primary' },
    { value: 'Primary', label: 'Primary' },
    { value: 'Middle', label: 'Middle' },
    { value: 'Secondary', label: 'Secondary' },
    { value: 'Senior-Secondary', label: 'Senior-Secondary' }
  ];

  // Track if custom value is selected
  isCustomValue = false;
  existingGradeValues: string[] = [];

  constructor(
    private fb: FormBuilder,
    private gradeService: GradeService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadExistingGrades();

    this.route.queryParamMap.subscribe(qp => {
      const raw = qp.get('branch_id');
      this.branchId = raw ? Number(raw) : undefined;
    });
    
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

  private loadExistingGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.existingGradeValues = response.data.map(g => g.value);
        }
      },
      error: () => {
        // Silently fail
      }
    });
  }

  private initForm(): void {
    this.gradeForm = this.fb.group({
      // Basic Information
      gradeSelector: [''],  // For dropdown selection
      value: ['', [Validators.required, Validators.maxLength(20)]],
      label: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      order: [null, [Validators.min(0)]],
      category: [''],
      
      // Status
      is_active: [true]
    });

    // Initially hide the custom value field
    this.gradeForm.get('value')?.disable();
  }

  private loadGrade(gradeValue: string): void {
    this.isLoading = true;

    this.gradeService.getGrade(gradeValue, this.branchId ? { branch_id: this.branchId } : undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const grade = response.data;
          this.currentGrade = grade;

          // In edit mode, enable value field for display (but make it readonly)
          this.gradeForm.get('value')?.enable();

          this.gradeForm.patchValue({
            gradeSelector: '', // Not used in edit mode
            value: grade.value,
            label: grade.label,
            description: grade.description,
            order: grade.order,
            category: grade.category,
            is_active: grade.is_active ?? true
          });

          // Make value readonly (not disabled) in edit mode so it appears in the form
          this.gradeForm.get('value')?.disable();
        }
        this.isLoading = false;
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
    
    // Remove gradeSelector from data (it's only for UI)
    delete formData.gradeSelector;

    const request = this.isEditMode && this.gradeValue
      ? this.gradeService.updateGrade(this.gradeValue, formData, this.branchId ? { branch_id: this.branchId } : undefined)
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

  onGradeSelectorChange(event: any): void {
    const selectedValue = event.value;
    
    if (selectedValue === 'custom') {
      // Enable custom input
      this.isCustomValue = true;
      this.gradeForm.get('value')?.enable();
      this.gradeForm.patchValue({
        value: '',
        label: '',
        category: '',
        order: null
      });
    } else {
      // Use predefined grade
      this.isCustomValue = false;
      this.gradeForm.get('value')?.disable();
      
      const selectedGrade = this.gradeValueOptions.find(g => g.value === selectedValue);
      if (selectedGrade) {
        this.gradeForm.patchValue({
          value: selectedGrade.value,
          label: selectedGrade.label,
          category: selectedGrade.category,
          order: selectedGrade.order
        });
      }
    }
  }

  onCategoryChange(event: any): void {
    // Helper function to suggest order based on category (only for custom grades)
    if (!this.isCustomValue) return;
    
    const category = event.value;
    const currentOrder = this.gradeForm.get('order')?.value;
    
    if (!currentOrder && !this.isEditMode) {
      const suggestedOrders: Record<string, number> = {
        'Pre-Primary': 1,
        'Primary': 5,
        'Middle': 10,
        'Secondary': 13,
        'Senior-Secondary': 15
      };
      
      if (category && suggestedOrders[category]) {
        this.gradeForm.patchValue({
          order: suggestedOrders[category]
        });
      }
    }
  }

  isGradeAlreadyExists(value: string): boolean {
    return this.existingGradeValues.includes(value);
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
      gradeSelector: 'Select Grade',
      value: 'Grade Value',
      label: 'Grade Label',
      description: 'Description',
      order: 'Display Order',
      category: 'Category'
    };
    return labels[fieldName] || fieldName;
  }

  getAvailableGradeOptions() {
    return this.gradeValueOptions.filter(option => {
      // Always show custom option
      if (option.value === 'custom') return true;
      // Hide already existing grades (unless in edit mode)
      return !this.existingGradeValues.includes(option.value);
    });
  }
}

