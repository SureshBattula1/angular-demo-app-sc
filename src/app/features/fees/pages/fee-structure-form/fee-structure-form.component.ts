import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeService } from '../../services/fee.service';
import { FeeTypeService } from '../../services/fee-type.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
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
  submitting = false;
  feeStructureId?: string | number;
  returnTab = 'structures';
  
  branches: any[] = [];
  grades: any[] = [];
  feeTypes: any[] = [];
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
    private feeTypeService: FeeTypeService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadGrades();
    this.loadFeeTypes(); // Loads fee types for user's school; branch filter applied when branch selected
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.feeStructureId = params['id'];
        this.isEditMode = true;
        this.loadFeeStructure();
      }
    });
    
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'] || 'structures';
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

    // Reload fee types when branch changes - show only fee types for the selected branch
    this.feeForm.get('branch_id')?.valueChanges.subscribe(branchId => {
      this.loadFeeTypes(branchId);
    });
  }
  
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: (error: any) => {
      }
    });
  }
  
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
        }
      },
      error: (error) => {
      }
    });
  }
  
  loadFeeTypes(branchId?: number | null): void {
    const params: Record<string, unknown> = { is_active: true };
    if (branchId) {
      params['branch_id'] = branchId;
    }
    this.feeTypeService.getFeeTypes(params).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feeTypes = response.data.map((ft: any) => ({
            value: ft.name,
            label: ft.name,
            code: ft.code
          }));
        }
      },
      error: (error: any) => {
      }
    });
  }
  
  loadFeeStructure(): void {
    if (!this.feeStructureId) return;
    
    this.isLoading = true;
    
    this.feeService.getFeeStructureById(this.feeStructureId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const structure = response.data;
          const formData = { ...structure };
          if (structure.due_date) {
            const d = structure.due_date;
            formData.due_date = typeof d === 'string'
              ? d.includes('T') ? d.split('T')[0] : d
              : d instanceof Date ? d.toISOString().split('T')[0] : d;
          }
          this.feeForm.patchValue(formData);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/fees'], {
          queryParams: { tab: this.returnTab }
        });
      }
    });
  }
  
  onSubmit(): void {
    if (this.feeForm.invalid) {
      this.markFormGroupTouched(this.feeForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }
    
    this.submitting = true;
    const formData = this.feeForm.value;
    
    const request = this.isEditMode && this.feeStructureId
      ? this.feeService.updateFeeStructure(this.feeStructureId, formData)
      : this.feeService.createFeeStructure(formData);
    
    request.subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Fee structure updated successfully' : 'Fee structure created successfully'
          );
          this.router.navigate(['/fees'], {
            queryParams: { tab: this.returnTab }
          });
        }
      },
      error: (error) => {
        this.submitting = false;
        this.errorHandler.showError(error);
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/fees'], {
      queryParams: { tab: this.returnTab }
    });
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
