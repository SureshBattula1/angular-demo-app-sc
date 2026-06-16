import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AccountService } from '../../services/account.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AccountCategory } from '../../../../core/models/account.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademicYearService, AcademicYear } from '../../../settings/services/academic-year.service';

@Component({
  selector: 'app-account-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './account-category-form.component.html',
  styleUrls: ['./account-category-form.component.scss']
})
export class AccountCategoryFormComponent implements OnInit {
  categoryForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  categoryId?: string;
  currentCategory?: AccountCategory;
  returnTab?: string;
  
  branches: any[] = [];
  loadingBranches = false;

  academicYears: AcademicYear[] = [];
  loadingAcademicYears = false;
  
  categoryTypes = [
    { value: 'Income', label: 'Income', icon: 'arrow_downward', color: 'success' },
    { value: 'Expense', label: 'Expense', icon: 'arrow_upward', color: 'danger' }
  ];

  incomeSubTypes = [
    'Tuition Fees',
    'Admission Fees',
    'Exam Fees',
    'Library Fees',
    'Laboratory Fees',
    'Sports Fees',
    'Transport Fees',
    'Donations',
    'Grants',
    'Other Income'
  ];

  expenseSubTypes = [
    'Salaries',
    'Utilities',
    'Maintenance',
    'Supplies',
    'Equipment',
    'Transportation',
    'Marketing',
    'Training',
    'Insurance',
    'Other Expenses'
  ];

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private branchService: BranchService,
    private academicYearService: AcademicYearService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();

    this.loadAcademicYears();
    
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.categoryId = params['id'];
        this.isEditMode = true;
        this.loadCategory(this.categoryId!);
      }
    });

    // Capture returnTab from query parameters
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'];
    });

    // Update sub_type options when type changes
    this.categoryForm.get('type')?.valueChanges.subscribe(() => {
      this.categoryForm.patchValue({ sub_type: '' });
    });
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      branch_id: [null],
      academic_year_id: [null, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      type: ['Income', Validators.required],
      sub_type: [''],
      description: [''],
      is_active: [true]
    });
  }

  private loadAcademicYears(): void {
    this.loadingAcademicYears = true;
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.academicYears = response.data;

          // Default academic year when creating or when existing category has none
          if (!this.categoryForm.get('academic_year_id')?.value) {
            const current = this.academicYears.find(y => y.is_current)
              || this.academicYears.find(y => y.is_active);
            if (current) {
              this.categoryForm.get('academic_year_id')?.setValue(current.id);
            }
          }
        }
        this.loadingAcademicYears = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loadingAcademicYears = false;
      }
    });
  }

  private loadBranches(): void {
    this.loadingBranches = true;
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
        this.loadingBranches = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loadingBranches = false;
      }
    });
  }

  private loadCategory(id: string): void {
    this.isLoading = true;
    
    this.accountService.getCategory(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentCategory = response.data;
          this.categoryForm.patchValue({
            branch_id: response.data.branch_id,
            academic_year_id: response.data.academic_year_id ?? response.data.academicYear?.id ?? null,
            name: response.data.name,
            code: response.data.code,
            type: response.data.type,
            sub_type: response.data.sub_type || '',
            description: response.data.description || '',
            is_active: response.data.is_active
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
  }

  get currentSubTypes(): string[] {
    const type = this.categoryForm.get('type')?.value;
    return type === 'Income' ? this.incomeSubTypes : this.expenseSubTypes;
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.isSaving = true;
      const formData = this.categoryForm.value;

      const request = this.isEditMode
        ? this.accountService.updateCategory(this.categoryId!, formData)
        : this.accountService.createCategory(formData);

      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(
              `Category ${this.isEditMode ? 'updated' : 'created'} successfully`,
              'Close',
              { duration: 3000 }
            );
            this.router.navigate(['/accounts'], { queryParams: { tab: 'categories' } });
          }
          this.isSaving = false;
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.categoryForm);
    }
  }

  onCancel(): void {
    if (this.returnTab) {
      this.router.navigate(['/accounts'], { queryParams: { tab: this.returnTab } });
    } else {
      this.router.navigate(['/accounts'], { queryParams: { tab: 'categories' } });
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
    const control = this.categoryForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Category Name',
      code: 'Code',
      type: 'Type',
      sub_type: 'Sub Type',
      description: 'Description'
    };
    return labels[fieldName] || fieldName;
  }
}

