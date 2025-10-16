import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ClassCrudService } from '../../services/class-crud.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Class, GradeOption, SectionOption } from '../../../../core/models/class.model';

@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './class-form.component.html',
  styleUrls: ['./class-form.component.scss']
})
export class ClassFormComponent implements OnInit {
  classForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  classId?: number;
  currentClass?: Class;
  
  branches: any[] = [];
  grades: GradeOption[] = [];
  sections: SectionOption[] = [];
  teachers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private classCrudService: ClassCrudService,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadGrades();
    this.loadSections();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.classId = +params['id'];
        this.isEditMode = true;
        this.loadClass(this.classId);
      }
    });
  }

  private initForm(): void {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const defaultAcademicYear = `${currentYear}-${nextYear}`;

    this.classForm = this.fb.group({
      branch_id: [null, Validators.required],
      grade: ['', Validators.required],
      section: [null],
      academic_year: [defaultAcademicYear, Validators.required],
      class_teacher_id: [null],
      capacity: [40, [Validators.required, Validators.min(1), Validators.max(100)]],
      room_number: [''],
      description: [''],
      is_active: [true]
    });
  }

  private loadClass(id: number): void {
    this.isLoading = true;
    
    this.classCrudService.getClass(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentClass = response.data;
          this.classForm.patchValue(response.data);
          this.isLoading = false;
        } else {
          this.errorHandler.showError(response.message || 'Failed to load class');
          this.isLoading = false;
          this.router.navigate(['/classes']);
        }
      },
      error: (error) => {
        console.error('Load class error:', error);
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/classes']);
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
        console.error('Error loading branches:', error);
      }
    });
  }

  private loadGrades(): void {
    this.classCrudService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading grades:', error);
      }
    });
  }

  private loadSections(): void {
    this.classCrudService.getSections().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sections = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading sections:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.classForm.invalid) {
      this.markFormGroupTouched(this.classForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.classForm.value;

    const request = this.isEditMode && this.classId
      ? this.classCrudService.updateClass(this.classId, formData)
      : this.classCrudService.createClass(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Class updated successfully' : 'Class created successfully'
          );
          this.router.navigate(['/classes']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/classes']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.classForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
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
      grade: 'Grade',
      section: 'Section',
      academic_year: 'Academic Year',
      class_teacher_id: 'Class Teacher',
      capacity: 'Capacity',
      room_number: 'Room Number'
    };
    return labels[fieldName] || fieldName;
  }
}

