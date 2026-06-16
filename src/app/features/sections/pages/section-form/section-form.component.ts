import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SectionService } from '../../services/section.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Section } from '../../../../core/models/section.model';
import { Grade } from '../../../../core/models/grade.model';

@Component({
  selector: 'app-section-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './section-form.component.html',
  styleUrls: ['./section-form.component.scss']
})
export class SectionFormComponent implements OnInit {
  sectionForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  sectionId?: string;
  currentSection?: Section;
  
  branches: any[] = [];
  grades: Grade[] = [];
  loadingGrades = false;

  constructor(
    private fb: FormBuilder,
    private sectionService: SectionService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.grades = [];
    this.sectionForm.get('grade_level')?.disable({ emitEvent: false });

    // Load grades based on selected branch
    this.sectionForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      if (branchId) {
        this.loadGradesForBranch(Number(branchId));
        this.sectionForm.get('grade_level')?.enable({ emitEvent: false });
      } else {
        this.grades = [];
        this.sectionForm.get('grade_level')?.setValue(null, { emitEvent: false });
        this.sectionForm.get('grade_level')?.disable({ emitEvent: false });
      }
    });
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.sectionId = params['id'];
        this.isEditMode = true;
        this.loadSection(this.sectionId!);
      }
    });
  }

  private initForm(): void {
    this.sectionForm = this.fb.group({
      branch_id: [null, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      grade_level: [null],
      capacity: [40, [Validators.required, Validators.min(1), Validators.max(100)]],
      room_number: [''],
      description: [''],
      is_active: [true]
    });
  }

  private loadSection(id: string | number): void {
    this.isLoading = true;
    
    this.sectionService.getSection(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentSection = response.data;
          this.sectionForm.patchValue(response.data);
          // Ensure grades are loaded for this section's branch (edit mode)
          if (response.data.branch_id) {
            this.loadGradesForBranch(Number(response.data.branch_id));
            this.sectionForm.get('grade_level')?.enable({ emitEvent: false });
          }
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/sections']);
      }
    });
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data;
        }
      },
      error: (error) => {
      }
    });
  }

  /**
   * Load grades from API
   */
  private loadGradesForBranch(branchId: number): void {
    this.loadingGrades = true;
    
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filter only active grades and format for dropdown
          this.grades = response.data.filter(grade => grade.is_active);
        }
        this.loadingGrades = false;
      },
      error: (error) => {
        this.errorHandler.showError('Failed to load grades');
        this.loadingGrades = false;
      }
    });
  }

  onSubmit(): void {
    if (this.sectionForm.invalid) {
      this.markFormGroupTouched(this.sectionForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.sectionForm.value;

    const request = this.isEditMode && this.sectionId
      ? this.sectionService.updateSection(this.sectionId, formData)
      : this.sectionService.createSection(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Section updated successfully' : 'Section created successfully'
          );
          this.router.navigate(['/sections']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/sections']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.sectionForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['min'].min}`;
    }
    
    if (control?.hasError('max')) {
      return `${this.getFieldLabel(fieldName)} cannot exceed ${control.errors?.['max'].max}`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      branch_id: 'Branch',
      name: 'Section Name',
      code: 'Section Code',
      grade_level: 'Grade Level',
      capacity: 'Capacity',
      room_number: 'Room Number'
    };
    return labels[fieldName] || fieldName;
  }
}


