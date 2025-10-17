import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SubjectService } from '../../services/subject.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Subject } from '../../../../core/models/subject.model';

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './subject-form.component.html',
  styleUrls: ['./subject-form.component.scss']
})
export class SubjectFormComponent implements OnInit {
  subjectForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  subjectId?: number;
  currentSubject?: Subject;
  
  branches: any[] = [];
  departments: any[] = [];
  teachers: any[] = [];
  
  grades = Array.from({length: 12}, (_, i) => ({ value: `${i + 1}`, label: `Grade ${i + 1}` }));
  subjectTypes = [
    { value: 'Core', label: 'Core', icon: 'star' },
    { value: 'Elective', label: 'Elective', icon: 'check_box' },
    { value: 'Language', label: 'Language', icon: 'language' },
    { value: 'Lab', label: 'Lab', icon: 'science' },
    { value: 'Activity', label: 'Activity', icon: 'sports' }
  ];

  constructor(
    private fb: FormBuilder,
    private subjectService: SubjectService,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadDepartments();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.subjectId = +params['id'];
        this.isEditMode = true;
        this.loadSubject(this.subjectId);
      }
    });
  }

  private initForm(): void {
    this.subjectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      department_id: [null, Validators.required],
      grade_level: ['', Validators.required],
      type: ['Core', Validators.required],
      branch_id: [null, Validators.required],
      teacher_id: [null],
      credits: [0, [Validators.min(0), Validators.max(10)]],
      description: [''],
      is_active: [true]
    });
  }

  private loadSubject(id: number): void {
    this.isLoading = true;
    
    this.subjectService.getSubject(id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.currentSubject = response.data;
          this.subjectForm.patchValue(response.data);
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/subjects']);
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

  private loadDepartments(): void {
    // You can inject DepartmentService if needed
    // For now, this is a placeholder
    this.departments = [];
  }

  onSubmit(): void {
    if (this.subjectForm.invalid) {
      this.markFormGroupTouched(this.subjectForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.subjectForm.value;

    const request = this.isEditMode && this.subjectId
      ? this.subjectService.updateSubject(this.subjectId, formData)
      : this.subjectService.createSubject(formData);

    request.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Subject updated successfully' : 'Subject created successfully'
          );
          this.router.navigate(['/subjects']);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/subjects']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.subjectForm.get(fieldName);
    
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
      name: 'Subject Name',
      code: 'Subject Code',
      grade_level: 'Grade Level',
      capacity: 'Capacity',
      room_number: 'Room Number'
    };
    return labels[fieldName] || fieldName;
  }
}

