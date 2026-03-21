import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AccountService } from '../../services/account.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Transaction, AccountCategory, TransactionFormData } from '../../../../core/models/account.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss']
})
export class TransactionFormComponent implements OnInit {
  transactionForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  transactionId?: number;
  currentTransaction?: Transaction;
  
  branches: any[] = [];
  categories: AccountCategory[] = [];
  incomeCategories: AccountCategory[] = [];
  expenseCategories: AccountCategory[] = [];
  loadingCategories = false;
  
  transactionTypes = [
    { value: 'Income', label: 'Income', icon: 'arrow_downward', color: 'success' },
    { value: 'Expense', label: 'Expense', icon: 'arrow_upward', color: 'warn' }
  ];
  
  paymentMethods = [
    { value: 'Cash', label: 'Cash', icon: 'money' },
    { value: 'Check', label: 'Check/Cheque', icon: 'receipt' },
    { value: 'Card', label: 'Debit/Credit Card', icon: 'credit_card' },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: 'account_balance' },
    { value: 'UPI', label: 'UPI', icon: 'qr_code_scanner' },
    { value: 'Other', label: 'Other', icon: 'more_horiz' }
  ];

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupTypeChangeListener();
    this.setupBranchChangeListener();
    this.loadBranches();

    // Check if type is passed via query params
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.transactionForm.patchValue({ type: params['type'] });
      }
    });

    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.transactionId = +params['id'];
        this.isEditMode = true;
        this.loadTransaction(this.transactionId);
      } else {
        // Create mode: load categories for all accessible branches (no branch filter yet)
        this.loadCategories();
      }
    });
  }

  private initForm(): void {
    this.transactionForm = this.fb.group({
      branch_id: [null, Validators.required],
      type: ['Income', Validators.required],
      category_id: [null, Validators.required],
      transaction_date: [new Date(), Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      party_name: [''],
      party_type: [''],
      payment_method: ['Cash', Validators.required],
      payment_reference: [''],
      bank_name: [''],
      description: ['', Validators.required],
      notes: ['']
    });
  }

  private setupTypeChangeListener(): void {
    this.transactionForm.get('type')?.valueChanges.subscribe(type => {
      this.filterCategoriesByType(type);
      // Clear category when type changes
      this.transactionForm.patchValue({ category_id: null }, { emitEvent: false });
    });
  }

  /** When branch changes, reload categories for that branch so dropdown is correct (and in edit mode includes current category) */
  private setupBranchChangeListener(): void {
    this.transactionForm.get('branch_id')?.valueChanges.subscribe(branchId => {
      if (branchId != null) {
        this.loadCategories(branchId);
      } else {
        this.loadCategories();
      }
    });
  }

  private loadTransaction(id: number): void {
    this.isLoading = true;

    this.accountService.getTransaction(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const d = response.data;
          this.currentTransaction = d;
          // Convert transaction_date to Date for mat-datepicker
          this.transactionForm.patchValue(
            {
              ...d,
              transaction_date: d.transaction_date ? new Date(d.transaction_date) : new Date()
            },
            { emitEvent: false }
          );
          // Load categories for this transaction's branch so dropdown populates (including current category)
          this.loadCategories(d.branch_id ?? undefined);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/accounts']);
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

  /** Load categories, optionally filtered by branch_id (so edit mode and branch change get the right list) */
  private loadCategories(branchId?: number): void {
    this.loadingCategories = true;
    const params: Record<string, unknown> = { is_active: true };
    if (branchId != null) {
      params['branch_id'] = branchId;
    }
    this.accountService.getCategories(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = response.data;
          const currentType = this.transactionForm.get('type')?.value;
          this.filterCategoriesByType(currentType);
        } else {
          this.errorHandler.showWarning('No categories found. Please create categories first.');
        }
        this.loadingCategories = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loadingCategories = false;
      }
    });
  }

  private filterCategoriesByType(type: string): void {
    if (type === 'Income') {
      this.incomeCategories = this.categories.filter(c => c.type === 'Income');
    } else {
      this.expenseCategories = this.categories.filter(c => c.type === 'Expense');
    }
  }

  get currentCategories(): AccountCategory[] {
    const type = this.transactionForm.get('type')?.value;
    return type === 'Income' ? this.incomeCategories : this.expenseCategories;
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.markFormGroupTouched(this.transactionForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const raw = this.transactionForm.value;
    const transactionDateStr =
      raw.transaction_date instanceof Date
        ? raw.transaction_date.toISOString().split('T')[0]
        : String(raw.transaction_date ?? '');
    const formData: TransactionFormData = {
      ...(raw as TransactionFormData),
      transaction_date: transactionDateStr
    };

    const request = this.isEditMode && this.transactionId
      ? this.accountService.updateTransaction(this.transactionId, formData)
      : this.accountService.createTransaction(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Transaction updated successfully' : 'Transaction created successfully'
          );
          this.router.navigate(['/accounts']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/accounts']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.transactionForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be greater than ${control.errors?.['min'].min}`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      branch_id: 'Branch',
      type: 'Transaction Type',
      category_id: 'Category',
      transaction_date: 'Date',
      amount: 'Amount',
      description: 'Description',
      payment_method: 'Payment Method'
    };
    return labels[fieldName] || fieldName;
  }
}

