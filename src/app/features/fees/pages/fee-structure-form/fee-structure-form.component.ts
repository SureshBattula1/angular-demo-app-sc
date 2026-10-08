import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeService } from '../../services/fee.service';
import { FeeTypeService } from '../../services/fee-type.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { AcademicYearService, AcademicYear } from '../../../settings/services/academic-year.service';
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
  academicYears: AcademicYear[] = [];
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
    private academicYearService: AcademicYearService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadAcademicYears();
    this.loadFeeTypes();
    
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
      academic_year_id: [null, Validators.required],
      due_date: [null as Date | string | null],
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

    // When branch changes: reload fee types and grades for that branch; clear grade selection
    this.feeForm.get('branch_id')?.valueChanges.subscribe(branchId => {
      this.loadFeeTypes(branchId);
      this.grades = [];
      this.feeForm.get('grade')?.setValue('');
      if (branchId) {
        this.loadGrades(branchId);
      }
    });

    // When fee type changes, auto-select academic year from the fee type and lock it.
    this.feeForm.get('fee_type')?.valueChanges.subscribe((feeTypeName: string) => {
      this.syncAcademicYearFromFeeType(feeTypeName);
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
  
  loadGrades(branchId: number): void {
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grades = response.data;
        } else {
          this.grades = [];
        }
      },
      error: () => {
        this.grades = [];
      }
    });
  }

  loadAcademicYears(): void {
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.academicYears = response.data;
          // Set default to current academic year if not in edit mode
          if (!this.isEditMode && !this.feeForm.get('academic_year_id')?.value) {
            const current = this.academicYears.find(y => y.is_current) || this.academicYears.find(y => y.is_active);
            if (current) {
              this.feeForm.get('academic_year_id')?.setValue(current.id);
            }
          }
        }
      },
      error: () => {
        this.academicYears = [];
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
            code: ft.code,
            academic_year_id: ft.academic_year_id ?? ft.academicYear?.id ?? null
          }));

          // If fee_type is already selected (e.g. edit mode / patchValue),
          // sync academic year now that we have the fee type payload.
          this.syncAcademicYearFromFeeType(this.feeForm.get('fee_type')?.value);
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
          // Load grades first, then patch - ensures grade dropdown matches (value vs label)
          const patchForm = (grades: any[]) => {
            const formData: Record<string, unknown> = {
              branch_id: structure.branch_id,
              fee_type: structure.fee_type,
              amount: structure.amount,
              academic_year_id: structure.academic_year_id ?? null,
              description: structure.description ?? '',
              is_recurring: structure.is_recurring ?? false,
              recurrence_period: structure.recurrence_period ?? null,
              is_active: structure.is_active !== false
            };
            // Resolve grade: use value that matches dropdown (structure may have "1" or "Grade 1")
            const resolvedGrade = this.resolveGradeForForm(structure.grade, grades);
            formData['grade'] = resolvedGrade;
            if (structure.due_date) {
              formData['due_date'] = this.parseToDate(structure.due_date);
            } else {
              formData['due_date'] = null;
            }
            this.feeForm.patchValue(formData);
          };
          if (structure.branch_id) {
            this.gradeService.getGrades({ branch_id: structure.branch_id }).subscribe({
              next: (gradeRes: any) => {
                const grades = gradeRes.success && gradeRes.data ? gradeRes.data : [];
                this.grades = grades;
                patchForm(grades);
                this.isLoading = false;
              },
              error: () => {
                this.grades = [];
                patchForm([]);
                this.isLoading = false;
              }
            });
          } else {
            this.grades = [];
            patchForm([]);
            this.isLoading = false;
          }
        } else {
          this.isLoading = false;
        }
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
    // Use getRawValue() so disabled controls (academic_year_id) are still sent.
    const formData = { ...this.feeForm.getRawValue() };
    // Convert due_date to YYYY-MM-DD string for API if it's a Date
    if (formData.due_date instanceof Date) {
      formData.due_date = formData.due_date.toISOString().split('T')[0];
    }
    
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
  
  private parseToDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const str = String(value);
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Resolve grade for form: structure may store "1" or "Grade 1".
   * Return the grade.value that matches dropdown options so mat-select displays correctly.
   */
  private resolveGradeForForm(structureGrade: string | null | undefined, grades: any[]): string {
    if (!structureGrade || !grades?.length) return structureGrade ?? '';
    const val = String(structureGrade).trim();
    const found = grades.find((g: any) => {
      const gVal = String(g.value ?? '').trim();
      const gLabel = String(g.label ?? '').trim();
      return gVal === val || gLabel === val ||
        gVal === structureGrade || gLabel === structureGrade;
    });
    return found ? String(found.value) : val;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      branch_id: 'Branch',
      grade: 'Grade',
      fee_type: 'Fee Type',
      amount: 'Amount',
      academic_year_id: 'Academic Year',
      due_date: 'Due Date',
      recurrence_period: 'Recurrence Period'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Set/lock academic_year_id based on selected fee type.
   * Requirement: when fee type is selected, academic year must be auto-selected and disabled.
   */
  private syncAcademicYearFromFeeType(feeTypeName: string | null | undefined): void {
    const ayCtrl = this.feeForm.get('academic_year_id');
    if (!ayCtrl) return;

    const selected = this.feeTypes?.find((t: any) => t?.value === feeTypeName);
    const academicYearId = selected?.academic_year_id ?? null;

    if (academicYearId != null) {
      // Keep academic_year_id synchronized with fee type, and disable for consistency.
      ayCtrl.setValue(academicYearId);
      ayCtrl.disable({ emitEvent: false });
    } else {
      // If fee type has no academic year, allow user selection.
      ayCtrl.enable({ emitEvent: false });
    }
  }
}
