import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AccountService } from '../../services/account.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Transaction, AccountCategory } from '../../../../core/models/account.model';

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
    this.loadBranches();
    this.loadCategories();
    
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
      }
    });

    // Debug log
    console.log('TransactionForm initialized with type:', this.transactionForm.get('type')?.value);
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.transactionForm = this.fb.group({
      branch_id: [null, Validators.required],
      type: ['Income', Validators.required],
      category_id: [null, Validators.required],
      transaction_date: [today, Validators.required],
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
      console.log('Type changed to:', type);
      this.filterCategoriesByType(type);
      // Clear category when type changes
      this.transactionForm.patchValue({ category_id: null }, { emitEvent: false });
    });
  }

  private loadTransaction(id: number): void {
    this.isLoading = true;
    
    this.accountService.getTransaction(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentTransaction = response.data;
          this.transactionForm.patchValue(response.data);
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

  private loadCategories(): void {
    this.loadingCategories = true;
    console.log('Starting to load categories...');
    
    this.accountService.getCategories({ is_active: true }).subscribe({
      next: (response) => {
        console.log('Raw API response:', response);
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
        console.log('Response data type:', typeof response.data);
        console.log('Response data is array:', Array.isArray(response.data));
        
        if (response.success && response.data) {
          this.categories = response.data;
          console.log('Categories assigned:', this.categories.length, 'items');
          console.log('First category:', this.categories[0]);
          
          const currentType = this.transactionForm.get('type')?.value;
          console.log('Current form type:', currentType);
          
          this.filterCategoriesByType(currentType);
        } else {
          console.error('No categories data in response:', response);
          this.errorHandler.showWarning('No categories found. Please create categories first.');
        }
        this.loadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading categories - Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.errorHandler.handleError(error);
        this.loadingCategories = false;
      }
    });
  }

  private filterCategoriesByType(type: string): void {
    if (type === 'Income') {
      this.incomeCategories = this.categories.filter(c => c.type === 'Income');
      console.log('Income categories filtered:', this.incomeCategories);
    } else {
      this.expenseCategories = this.categories.filter(c => c.type === 'Expense');
      console.log('Expense categories filtered:', this.expenseCategories);
    }
  }

  get currentCategories(): AccountCategory[] {
    const type = this.transactionForm.get('type')?.value;
    const filtered = type === 'Income' ? this.incomeCategories : this.expenseCategories;
    console.log('Current categories for type', type, ':', filtered);
    return filtered;
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.markFormGroupTouched(this.transactionForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.transactionForm.value;

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

