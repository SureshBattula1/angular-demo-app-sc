import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeService } from '../../services/fee.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FeeStructure } from '../../../../core/models/fee.model';

@Component({
  selector: 'app-fee-structure-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './fee-structure-form.component.html',
  styleUrls: ['./fee-structure-form.component.scss']
})
export class FeeStructureFormComponent implements OnInit {
  feeForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  feeStructureId?: string | number;
  
  branches: any[] = [];
  grades = Array.from({length: 12}, (_, i) => (i + 1).toString());
  feeTypes = [
    { value: 'Tuition', label: 'Tuition Fee' },
    { value: 'Library', label: 'Library Fee' },
    { value: 'Laboratory', label: 'Laboratory Fee' },
    { value: 'Sports', label: 'Sports Fee' },
    { value: 'Transport', label: 'Transport Fee' },
    { value: 'Exam', label: 'Examination Fee' },
    { value: 'Other', label: 'Other Fee' }
  ];
  recurrencePeriods = [
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Quarterly', label: 'Quarterly' },
    { value: 'Annually', label: 'Annually' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private feeService: FeeService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.feeStructureId = params['id'];
        this.isEditMode = true;
        this.loadFeeStructure();
      }
    });
  }
  
  initForm(): void {
    this.feeForm = this.fb.group({
      branch_id: [null, Validators.required],
      grade: ['', Validators.required],
      fee_type: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      academic_year: [this.getCurrentAcademicYear(), Validators.required],
      due_date: [''],
      description: [''],
      is_recurring: [false],
      recurrence_period: [null],
      is_active: [true]
    });
    
    // Enable/disable recurrence_period based on is_recurring
    this.feeForm.get('is_recurring')?.valueChanges.subscribe(isRecurring => {
      const recurrenceControl = this.feeForm.get('recurrence_period');
      if (isRecurring) {
        recurrenceControl?.setValidators(Validators.required);
      } else {
        recurrenceControl?.clearValidators();
        recurrenceControl?.setValue(null);
      }
      recurrenceControl?.updateValueAndValidity();
    });
  }
  
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.branches = response.data;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
      }
    });
  }
  
  loadFeeStructure(): void {
    if (!this.feeStructureId) return;
    
    this.isLoading = true;
    
    this.feeService.getFeeStructureById(this.feeStructureId).subscribe({
      next: (response: any) => {
        if (response.success || response.data) {
          const structure = response.data || response;
          this.feeForm.patchValue(structure);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/fees']);
      }
    });
  }
  
  onSubmit(): void {
    if (this.feeForm.invalid) {
      this.markFormGroupTouched(this.feeForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }
    
    this.isLoading = true;
    const formData = this.feeForm.value;
    
    const request = this.isEditMode && this.feeStructureId
      ? this.feeService.updateFeeStructure(this.feeStructureId, formData)
      : this.feeService.createFeeStructure(formData);
    
    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Fee structure updated successfully' : 'Fee structure created successfully'
          );
          this.router.navigate(['/fees']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/fees']);
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
  
  private getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (month >= 3) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }
  
  getErrorMessage(fieldName: string): string {
    const control = this.feeForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['min'].min}`;
    }
    
    return '';
  }
  
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      branch_id: 'Branch',
      grade: 'Grade',
      fee_type: 'Fee Type',
      amount: 'Amount',
      academic_year: 'Academic Year',
      due_date: 'Due Date',
      recurrence_period: 'Recurrence Period'
    };
    return labels[fieldName] || fieldName;
  }
}

