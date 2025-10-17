import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Department } from '../../../../core/models/department.model';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.scss']
})
export class DepartmentFormComponent implements OnInit {
  departmentForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  departmentId?: number;
  currentDepartment?: Department;
  
  branches: any[] = [];
  grades = [
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
    private departmentService: DepartmentService,
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
        this.departmentId = +params['id'];
        this.isEditMode = true;
        this.loadDepartment(this.departmentId);
      }
    });
  }

  private initForm(): void {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      head: ['', [Validators.required, Validators.maxLength(255)]],
      head_id: [null],
      branch_id: [null, Validators.required],
      established_date: ['', Validators.required],
      students_count: [0],
      teachers_count: [0],
      description: [''],
      is_active: [true]
    });
  }

  private loadDepartment(id: number): void {
    this.isLoading = true;
    
    this.departmentService.getDepartment(id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.currentDepartment = response.data;
          this.departmentForm.patchValue(response.data);
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/departments']);
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
    if (this.departmentForm.invalid) {
      this.markFormGroupTouched(this.departmentForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.departmentForm.value;

    const request = this.isEditMode && this.departmentId
      ? this.departmentService.updateDepartment(this.departmentId, formData)
      : this.departmentService.createDepartment(formData);

    request.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Department updated successfully' : 'Department created successfully'
          );
          this.router.navigate(['/departments']);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/departments']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.departmentForm.get(fieldName);
    
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
      name: 'Department Name',
      code: 'Department Code',
      grade_level: 'Grade Level',
      capacity: 'Capacity',
      room_number: 'Room Number'
    };
    return labels[fieldName] || fieldName;
  }
}

