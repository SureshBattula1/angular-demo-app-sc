import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AccountService } from '../../services/account.service';
import { BranchService } from '../../../branches/services/branch.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AccountCategory, Transaction } from '../../../../core/models/account.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, skip } from 'rxjs/operators';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, DataTableComponent, MatButtonToggleModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
  // Performance: Use OnPush change detection
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountListComponent implements OnInit, OnDestroy {
  @ViewChild('incomeTable') incomeTable!: DataTableComponent;
  @ViewChild('expensesTable') expensesTable!: DataTableComponent;
  @ViewChild('categoriesTable') categoriesTable!: DataTableComponent;
  
  private destroy$ = new Subject<void>();
  private loadingInProgress = new Set<string>();
  
  loading = false;
  activeTab: 'income' | 'expenses' | 'categories' | 'dashboard' = 'dashboard';
  
  // Track which tabs have been loaded for lazy loading
  private loadedTabs = new Set<string>(['dashboard']);
  
  // Separate data arrays for each tab
  incomeTransactions: Transaction[] = [];
  expenseTransactions: Transaction[] = [];
  categories: AccountCategory[] = [];
  
  selectedRecords: (Transaction | AccountCategory)[] = [];
  
  // Counts for tab badges and pagination
  incomeCount = 0;
  expenseCount = 0;
  categoryCount = 0;
  
  // Current filters for each tab with pagination (default sort: created_at desc - newest first)
  incomeFilters: Record<string, unknown> = { type: 'Income', page: 1, per_page: 25, sort_by: 'created_at', sort_order: 'desc' };
  expenseFilters: Record<string, unknown> = { type: 'Expense', page: 1, per_page: 25, sort_by: 'created_at', sort_order: 'desc' };
  categoryFilters: Record<string, unknown> = { page: 1, per_page: 25 };
  
  branches: any[] = [];

  // Dashboard filters
  dashboardBranch: number | string = '';
  dashboardPeriod = new FormControl('today');
  dashboardCustomFrom = new FormControl<Date | null>(null);
  dashboardCustomTo = new FormControl<Date | null>(null);

  // Dashboard loading (separate from global loading for tab-specific loader)
  dashboardLoading = false;

  // Dashboard stats
  dashboardStats = {
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
    income_count: 0,
    expense_count: 0,
    category_count: 0
  };
  
  // Table configurations
  incomeTableConfig: TableConfig = {
    columns: [
      { key: 'branch.name', header: 'Branch', sortable: true, width: '150px' },
      { key: 'transaction_number', header: 'Transaction #', sortable: true, searchable: true, width: '140px' },
      { key: 'transaction_date', header: 'Date', type: 'date', sortable: true, width: '120px' },
      { key: 'category.name', header: 'Category', sortable: true, searchable: true },
      { key: 'description', header: 'Description', searchable: true },
      { key: 'payment_method', header: 'Method', width: '120px' },
      { key: 'amount', header: 'Amount', type: 'number', sortable: true, width: '130px', align: 'right' },
      { key: 'status', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewTransaction(row), permission: 'accounts.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editTransaction(row), permission: 'accounts.edit', show: (row) => row.status === 'Pending' },
      { icon: 'check_circle', label: 'Approve', color: 'accent', action: (row) => this.approveTransaction(row), permission: 'accounts.approve', show: (row) => row.status === 'Pending' },
      { icon: 'cancel', label: 'Reject', color: 'warn', action: (row) => this.rejectTransaction(row), permission: 'accounts.approve', show: (row) => row.status === 'Pending' },
      { icon: 'download', label: 'Download Receipt', color: 'primary', action: (row) => this.downloadReceipt(row), permission: 'accounts.view' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteTransaction(row), permission: 'accounts.delete', show: (row) => row.status !== 'Approved' }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    addButtonPermission: 'accounts.create'
  };
  
  expensesTableConfig: TableConfig = {
    columns: [
      { key: 'branch.name', header: 'Branch', sortable: true, width: '150px' },
      { key: 'transaction_number', header: 'Transaction #', sortable: true, searchable: true, width: '140px' },
      { key: 'transaction_date', header: 'Date', type: 'date', sortable: true, width: '120px' },
      { key: 'category.name', header: 'Category', sortable: true, searchable: true },
      { key: 'description', header: 'Description', searchable: true },
      { key: 'payment_method', header: 'Method', width: '120px' },
      { key: 'amount', header: 'Amount', type: 'number', sortable: true, width: '130px', align: 'right' },
      { key: 'status', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewTransaction(row), permission: 'accounts.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editTransaction(row), permission: 'accounts.edit', show: (row) => row.status === 'Pending' },
      { icon: 'check_circle', label: 'Approve', color: 'accent', action: (row) => this.approveTransaction(row), permission: 'accounts.approve', show: (row) => row.status === 'Pending' },
      { icon: 'cancel', label: 'Reject', color: 'warn', action: (row) => this.rejectTransaction(row), permission: 'accounts.approve', show: (row) => row.status === 'Pending' },
      { icon: 'download', label: 'Download Receipt', color: 'primary', action: (row) => this.downloadReceipt(row), permission: 'accounts.view' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteTransaction(row), permission: 'accounts.delete', show: (row) => row.status !== 'Approved' }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    addButtonPermission: 'accounts.create'
  };
  
  categoriesTableConfig: TableConfig = {
    columns: [
      { key: 'branch.name', header: 'Branch', sortable: true },
      { key: 'name', header: 'Category Name', sortable: true, searchable: true },
      { key: 'code', header: 'Code', sortable: true, searchable: true },      
      { key: 'academic_year_name', header: 'Academic Year', sortable: true, searchable: false, width: '160px' },
      {
        key: 'type',
        header: 'Type',
        type: 'badge',
        sortable: true,
        width: '110px',
        align: 'center',
        cellClass: (row: any) => row?.type === 'Expense' ? 'badge-danger' : 'badge-success'
      },
      { key: 'sub_type', header: 'Sub Type', sortable: true, width: '140px' },
      {
        key: 'is_active_display',
        header: 'Status',
        type: 'badge',
        width: '100px',
        align: 'center',
        cellClass: (row: any) => this.toBoolean(row.is_active) ? 'badge-success' : 'badge-danger'
      }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewCategory(row), permission: 'accounts.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editCategory(row), permission: 'accounts.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteCategory(row), permission: 'accounts.delete' }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: false,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    addButtonPermission: 'accounts.create'
  };
  
  // Search configurations
  transactionSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Transaction Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        icon: 'business',
        options: []
      },
      {
        key: 'category_id',
        label: 'Category',
        type: 'select',
        icon: 'category',
        options: []
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'check_circle',
        options: [
          { value: 'Pending', label: 'Pending' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Rejected', label: 'Rejected' }
        ]
      },
      {
        key: 'payment_method',
        label: 'Payment Method',
        type: 'select',
        icon: 'payment',
        options: [
          { value: 'Cash', label: 'Cash' },
          { value: 'Check', label: 'Check' },
          { value: 'Card', label: 'Card' },
          { value: 'Bank Transfer', label: 'Bank Transfer' },
          { value: 'UPI', label: 'UPI' }
        ]
      }
    ]
  };
  
  categorySearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Category Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        placeholder: 'Select branch',
        icon: 'business',
        options: []
      },
      {
        key: 'type',
        label: 'Category Type',
        type: 'select',
        placeholder: 'Select type',
        icon: 'category',
        options: [
          { value: 'Income', label: 'Income' },
          { value: 'Expense', label: 'Expense' }
        ]
      },
      {
        key: 'name',
        label: 'Category Name',
        type: 'text',
        placeholder: 'Enter category name',
        icon: 'label'
      },
      {
        key: 'code',
        label: 'Code',
        type: 'text',
        placeholder: 'Enter code',
        icon: 'tag'
      },
      {
        key: 'is_active',
        label: 'Active Only',
        type: 'checkbox',
        icon: 'check_circle'
      }
    ]
  };
  
  constructor(
    private accountService: AccountService,
    private branchService: BranchService,
    private academicYearContext: AcademicYearContextService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadCategoriesForDropdown(); // Load all active categories for dropdown
    this.loadDashboardStats();

    // Reload data when toolbar academic year changes
    this.academicYearContext.selectedYearId$
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCategories();
        if (this.loadedTabs.has('income')) this.loadIncomeTransactions();
        if (this.loadedTabs.has('expenses')) this.loadExpenseTransactions();
      });

    // Check for tab query parameter
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['tab']) {
        this.switchTab(params['tab'] as any);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Load all active categories for dropdown (not paginated) - OPTIMIZED
  private loadCategoriesForDropdown(): void {
    // Prevent duplicate loads
    if (this.loadingInProgress.has('categoriesDropdown')) return;
    this.loadingInProgress.add('categoriesDropdown');
    
    this.accountService.getCategories({ is_active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Update category count for badge
            this.categoryCount = response.data.length;
            
            // Update category options in search dropdowns
            const categoryField = this.transactionSearchConfig.fields.find(f => f.key === 'category_id');
            if (categoryField) {
              categoryField.options = response.data.map(c => ({
                value: c.id.toString(),
                label: `${c.name} (${c.type})`
              }));
            }
            this.loadingInProgress.delete('categoriesDropdown');
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.loadingInProgress.delete('categoriesDropdown');
        }
      });
  }
  
  switchTab(tab: 'income' | 'expenses' | 'categories' | 'dashboard'): void {
    this.activeTab = tab;
    
    // Update URL without reloading
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    
    // Load data if not already loaded
    if (!this.loadedTabs.has(tab)) {
      this.loadedTabs.add(tab);
      this.loadTabData(tab);
    }
  }
  
  isTabLoaded(tab: string): boolean {
    return this.loadedTabs.has(tab);
  }
  
  loadTabData(tab: string): void {
    switch (tab) {
      case 'income':
        this.loadIncomeTransactions();
        break;
      case 'expenses':
        this.loadExpenseTransactions();
        break;
      case 'categories':
        this.loadCategories();
        break;
      case 'dashboard':
        this.loadDashboardStats();
        break;
    }
  }
  
  loadBranches(): void {
    // Prevent duplicate loads
    if (this.loadingInProgress.has('branches')) return;
    this.loadingInProgress.add('branches');
    
    this.branchService.getBranches({ is_active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.branches = response.data;
            const options = response.data.map(b => ({ value: b.id.toString(), label: b.name }));
            
            // Update search configs for transactions
            const branchField = this.transactionSearchConfig.fields.find(f => f.key === 'branch_id');
            if (branchField) branchField.options = options;
            
            // Update search configs for categories
            const categoryBranchField = this.categorySearchConfig.fields.find(f => f.key === 'branch_id');
            if (categoryBranchField) categoryBranchField.options = options;
            
            this.loadingInProgress.delete('branches');
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          this.loadingInProgress.delete('branches');
        }
      });
  }
  
  onDashboardFilterChange(): void {
    this.loadingInProgress.delete('dashboard');
    this.loadDashboardStats();
  }

  onDashboardCustomRangeChange(): void {
    if (this.dashboardCustomFrom.value && this.dashboardCustomTo.value) {
      this.onDashboardFilterChange();
    }
  }

  private getDashboardDateRange(): { from_date?: string; to_date?: string } {
    const period = this.dashboardPeriod.value || 'month';
    if (period === 'custom') {
      if (this.dashboardCustomFrom.value && this.dashboardCustomTo.value) {
        return {
          from_date: this.formatDashboardDate(this.dashboardCustomFrom.value),
          to_date: this.formatDashboardDate(this.dashboardCustomTo.value)
        };
      }
      return {};
    }
    const now = new Date();
    let from: Date;
    let to: Date;
    if (period === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(from);
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      from = new Date(now.getFullYear(), now.getMonth(), diff);
      to = new Date(now);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now);
    }
    return {
      from_date: this.formatDashboardDate(from),
      to_date: this.formatDashboardDate(to)
    };
  }

  private formatDashboardDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const y = d.getFullYear();
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  }

  loadDashboardStats(): void {
    // Prevent duplicate loads
    if (this.loadingInProgress.has('dashboard')) return;
    this.loadingInProgress.add('dashboard');

    this.loading = true;
    this.dashboardLoading = true;
    this.cdr.markForCheck();

    const params: Record<string, unknown> = { financial_year: this.getCurrentFinancialYear() };
    if (this.dashboardBranch !== '' && this.dashboardBranch != null) {
      params['branch_id'] = this.dashboardBranch;
    }
    const dateRange = this.getDashboardDateRange();
    if (dateRange.from_date) params['from_date'] = dateRange.from_date;
    if (dateRange.to_date) params['to_date'] = dateRange.to_date;

    this.accountService.getDashboard(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.dashboardStats = {
              total_income: response.data.summary?.total_income || 0,
              total_expense: response.data.summary?.total_expense || 0,
              net_balance: response.data.summary?.net_balance || 0,
              income_count: this.incomeCount,
              expense_count: this.expenseCount,
              category_count: (response.data.summary as { category_count?: number })?.category_count ?? this.categoryCount
            };
          }
          this.loading = false;
          this.dashboardLoading = false;
          this.loadingInProgress.delete('dashboard');
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.loading = false;
          this.dashboardLoading = false;
          this.loadingInProgress.delete('dashboard');
          this.cdr.markForCheck();
        }
      });
  }
  
  loadIncomeTransactions(): void {
    // Prevent duplicate loads
    if (this.loadingInProgress.has('income')) return;
    this.loadingInProgress.add('income');
    
    this.loading = true;
    this.cdr.markForCheck();

    const academicYearId = this.academicYearContext.selectedYearId;
    const requestFilters = academicYearId != null
      ? { ...this.incomeFilters, academic_year_id: academicYearId }
      : this.incomeFilters;
    
    this.accountService.getTransactions(requestFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.incomeTransactions = response.data;
            // Update total count from meta if available (for pagination)
            if (response.meta?.total !== undefined) {
              this.incomeCount = response.meta.total;
              this.incomeTableConfig = { ...this.incomeTableConfig, totalCount: response.meta.total };
            } else {
              this.incomeCount = response.count || response.data.length;
              this.incomeTableConfig = { ...this.incomeTableConfig, totalCount: this.incomeCount };
            }
          }
          this.loading = false;
          this.loadingInProgress.delete('income');
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.loading = false;
          this.loadingInProgress.delete('income');
          this.cdr.markForCheck();
        }
      });
  }
  
  loadExpenseTransactions(): void {
    // Prevent duplicate loads
    if (this.loadingInProgress.has('expense')) return;
    this.loadingInProgress.add('expense');
    
    this.loading = true;
    this.cdr.markForCheck();

    const academicYearId = this.academicYearContext.selectedYearId;
    const requestFilters = academicYearId != null
      ? { ...this.expenseFilters, academic_year_id: academicYearId }
      : this.expenseFilters;
    
    this.accountService.getTransactions(requestFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.expenseTransactions = response.data;
            // Update total count from meta if available (for pagination)
            if (response.meta?.total !== undefined) {
              this.expenseCount = response.meta.total;
              this.expensesTableConfig = { ...this.expensesTableConfig, totalCount: response.meta.total };
            } else {
              this.expenseCount = response.count || response.data.length;
              this.expensesTableConfig = { ...this.expensesTableConfig, totalCount: this.expenseCount };
            }
          }
          this.loading = false;
          this.loadingInProgress.delete('expense');
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.loading = false;
          this.loadingInProgress.delete('expense');
          this.cdr.markForCheck();
        }
      });
  }
  
  loadCategories(): void {
    // Prevent duplicate loads
    if (this.loadingInProgress.has('categories')) return;
    this.loadingInProgress.add('categories');
    
    this.loading = true;
    this.cdr.markForCheck();

    const academicYearId = this.academicYearContext.selectedYearId;
    const requestFilters = academicYearId != null
      ? { ...this.categoryFilters, academic_year_id: academicYearId }
      : this.categoryFilters;
    
    this.accountService.getCategories(requestFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categories = (response.data as AccountCategory[]).map((item: any) => ({
              ...item,
              academic_year_name: item?.academicYear?.name ?? item?.academic_year?.name ?? null,
              is_active_display: this.toBoolean(item.is_active) ? 'Active' : 'Deactive'
            }));
            this.categoryCount = response.count || response.data.length;
            this.categoriesTableConfig = { ...this.categoriesTableConfig, totalCount: this.categoryCount };
          }
          this.loading = false;
          this.loadingInProgress.delete('categories');
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.loading = false;
          this.loadingInProgress.delete('categories');
          this.cdr.markForCheck();
        }
      });
  }
  
  // Transaction actions
  viewTransaction(transaction: Transaction): void {
    // No dedicated view page; the transaction form (edit route) displays all details.
    this.router.navigate(['/accounts/transactions/edit', transaction.id]);
  }
  
  editTransaction(transaction: Transaction): void {
    this.router.navigate(['/accounts/transactions/edit', transaction.id]);
  }
  
  approveTransaction(transaction: Transaction): void {
    const confirmed = confirm(`Approve transaction "${transaction.transaction_number}" for ${transaction.amount}?`);
    
    if (!confirmed) return;
    
    this.accountService.approveTransaction(transaction.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Transaction approved successfully', 'Close', { duration: 3000 });
          if (transaction.type === 'Income') {
            this.loadIncomeTransactions();
          } else {
            this.loadExpenseTransactions();
          }
          this.loadDashboardStats();
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  rejectTransaction(transaction: Transaction): void {
    const confirmed = confirm(`Reject transaction "${transaction.transaction_number}"?`);
    
    if (!confirmed) return;
    
    this.accountService.rejectTransaction(transaction.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Transaction rejected successfully', 'Close', { duration: 3000 });
          if (transaction.type === 'Income') {
            this.loadIncomeTransactions();
          } else {
            this.loadExpenseTransactions();
          }
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  downloadReceipt(transaction: Transaction): void {
    if (transaction.status !== 'Approved') {
      this.snackBar.open('Receipt is only available for approved transactions.', 'Close', { duration: 3000 });
      return;
    }
    this.snackBar.open('Preparing receipt PDF...', 'Close', { duration: 2000 });
    this.accountService.downloadTransactionReceipt(transaction.id).subscribe({
      next: (blob: Blob) => {
        const fileName = (transaction.transaction_number ? `${transaction.type.toLowerCase()}-receipt-${transaction.transaction_number}` : `${transaction.type.toLowerCase()}-receipt-${transaction.id}`).replace(/[#\s]/g, '-') + '.pdf';
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Receipt downloaded.', 'Close', { duration: 2000 });
      },
      error: (err) => this.errorHandler.handleError(err)
    });
  }

  deleteTransaction(transaction: Transaction): void {
    const confirmed = confirm(`Are you sure you want to delete transaction "${transaction.transaction_number}"?`);
    
    if (!confirmed) return;
    
    this.accountService.deleteTransaction(transaction.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Transaction deleted successfully', 'Close', { duration: 3000 });
          if (transaction.type === 'Income') {
            this.loadIncomeTransactions();
          } else {
            this.loadExpenseTransactions();
          }
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  // Category actions
  viewCategory(category: AccountCategory): void {
    this.router.navigate(['/accounts/categories', category.id], { queryParams: { returnTab: 'categories' } });
  }
  
  editCategory(category: AccountCategory): void {
    this.router.navigate(['/accounts/categories', category.id, 'edit'], { queryParams: { returnTab: 'categories' } });
  }
  
  deleteCategory(category: AccountCategory): void {
    const confirmed = confirm(`Are you sure you want to delete "${category.name}"?`);
    
    if (!confirmed) return;
    
    this.accountService.deleteCategory(category.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
          this.loadCategories();
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  // Event handlers
  onAction(event: { action: string }): void {
    if (event.action === 'add') {
      if (this.activeTab === 'categories') {
        this.router.navigate(['/accounts/categories/new']);
      } else {
        this.router.navigate(['/accounts/transactions/create']);
      }
    }
  }
  
  onRowClick(row: any): void {
    if (this.activeTab === 'categories') {
      this.viewCategory(row);
    } else if (this.activeTab === 'income' || this.activeTab === 'expenses') {
      this.viewTransaction(row);
    }
  }
  
  onSelectionChange(selected: any[]): void {
    this.selectedRecords = selected;
  }
  
  onIncomePaginationChange(event: PaginationEvent): void {
    this.incomeFilters = { ...this.incomeFilters, page: event.page, per_page: event.pageSize };
    this.loadIncomeTransactions();
  }
  
  onExpensePaginationChange(event: PaginationEvent): void {
    this.expenseFilters = { ...this.expenseFilters, page: event.page, per_page: event.pageSize };
    this.loadExpenseTransactions();
  }
  
  onCategoryPaginationChange(event: PaginationEvent): void {
    this.categoryFilters = { ...this.categoryFilters, page: event.page, per_page: event.pageSize };
    this.loadCategories();
  }
  
  onIncomeSortChange(event: SortEvent): void {
    this.incomeFilters = { ...this.incomeFilters, sort_by: event.field, sort_order: event.direction };
    this.loadIncomeTransactions();
  }
  
  onExpenseSortChange(event: SortEvent): void {
    this.expenseFilters = { ...this.expenseFilters, sort_by: event.field, sort_order: event.direction };
    this.loadExpenseTransactions();
  }
  
  onCategorySortChange(event: SortEvent): void {
    this.categoryFilters = { ...this.categoryFilters, sort_by: event.field, sort_order: event.direction };
    this.loadCategories();
  }
  
  // Basic search handlers
  onIncomeBasicSearch(query: string): void {
    this.incomeFilters = { type: 'Income', page: 1, search: query };
    this.loadIncomeTransactions();
  }
  
  onExpenseBasicSearch(query: string): void {
    this.expenseFilters = { type: 'Expense', page: 1, search: query };
    this.loadExpenseTransactions();
  }
  
  onCategoryBasicSearch(query: string): void {
    this.categoryFilters = { page: 1, search: query };
    this.loadCategories();
  }
  
  // Advanced search handlers
  onIncomeSearch(event: SearchEvent): void {
    this.incomeFilters = { ...event.filters, type: 'Income', page: 1 };
    this.loadIncomeTransactions();
  }
  
  onExpenseSearch(event: SearchEvent): void {
    this.expenseFilters = { ...event.filters, type: 'Expense', page: 1 };
    this.loadExpenseTransactions();
  }
  
  onCategorySearch(event: SearchEvent): void {
    this.categoryFilters = { ...event.filters, page: 1 };
    this.loadCategories();
  }

  onIncomeSearchReset(): void {
    this.incomeFilters = { type: 'Income', page: 1, per_page: 25, sort_by: 'created_at', sort_order: 'desc' };
    this.loadIncomeTransactions();
  }

  onExpenseSearchReset(): void {
    this.expenseFilters = { type: 'Expense', page: 1, per_page: 25, sort_by: 'created_at', sort_order: 'desc' };
    this.loadExpenseTransactions();
  }

  onCategorySearchReset(): void {
    this.categoryFilters = { page: 1, per_page: 25 };
    this.loadCategories();
  }
  
  onExport(format: string): void {
    // Implement export logic when needed
  }

  // TrackBy functions for better performance
  trackByTransactionId(index: number, item: Transaction): string | number {
    return item.id;
  }

  trackByCategoryId(index: number, item: AccountCategory): string | number {
    return item.id;
  }

  private getCurrentFinancialYear(): string {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    if (month < 4) {
      return `${year - 1}-${year}`;
    }
    return `${year}-${year + 1}`;
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = String(value).trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'active';
    }
    return false;
  }
}

