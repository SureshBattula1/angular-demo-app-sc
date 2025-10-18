import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AccountService } from '../../services/account.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Transaction } from '../../../../core/models/account.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="transactions"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Expense Transactions'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class ExpenseListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  transactions: Transaction[] = [];
  selectedTransactions: Transaction[] = [];
  currentFilters: Record<string, unknown> = { type: 'Expense' };
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'transaction_number', header: 'Transaction #', sortable: true, searchable: true, width: '150px' },
      { key: 'transaction_date', header: 'Date', type: 'date', sortable: true, width: '120px' },
      { key: 'category.name', header: 'Category', sortable: true, searchable: true },
      { key: 'description', header: 'Description', searchable: true },
      { key: 'party_name', header: 'To', searchable: true, width: '150px' },
      { key: 'payment_method', header: 'Method', width: '120px' },
      { key: 'amount', header: 'Amount', type: 'number', align: 'right', width: '130px' },
      { key: 'status', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewTransaction(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editTransaction(row) },
      { icon: 'check_circle', label: 'Approve', color: 'accent', action: (row) => this.approveTransaction(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteTransaction(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: false,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Expense Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'from_date',
        label: 'From Date',
        type: 'date',
        icon: 'event',
        group: 'Date Range'
      },
      {
        key: 'to_date',
        label: 'To Date',
        type: 'date',
        icon: 'event',
        group: 'Date Range'
      },
      {
        key: 'category_id',
        label: 'Category',
        type: 'select',
        icon: 'category',
        options: [],
        group: 'Filters'
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
        ],
        group: 'Filters'
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
        ],
        group: 'Filters'
      }
    ]
  };
  
  constructor(
    private accountService: AccountService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadTransactions();
    this.loadCategories();
  }
  
  loadTransactions(): void {
    this.loading = true;
    
    this.accountService.getTransactions(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transactions = response.data;
          this.tableConfig.totalCount = response.data.length;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }
  
  loadCategories(): void {
    this.accountService.getCategories({ type: 'Expense', is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const categoryField = this.advancedSearchConfig.fields.find(f => f.key === 'category_id');
          if (categoryField) {
            categoryField.options = response.data.map(c => ({ value: c.id, label: c.name }));
          }
        }
      },
      error: (error) => console.error('Error loading categories:', error)
    });
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      ...event.filters,
      search: event.query
    };
    this.loadTransactions();
  }
  
  onAction(event: { action: string, row: Transaction | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/accounts/transactions/create'], {
        queryParams: { type: 'Expense' }
      });
    }
  }
  
  onRowClick(row: Transaction): void {
    this.viewTransaction(row);
  }
  
  onSelectionChange(selected: Transaction[]): void {
    this.selectedTransactions = selected;
  }
  
  viewTransaction(transaction: Transaction): void {
    this.router.navigate(['/accounts/transactions/view', transaction.id]);
  }
  
  editTransaction(transaction: Transaction): void {
    if (transaction.status === 'Pending') {
      this.router.navigate(['/accounts/transactions/edit', transaction.id]);
    } else {
      this.errorHandler.showWarning('Only pending transactions can be edited');
    }
  }
  
  approveTransaction(transaction: Transaction): void {
    if (transaction.status !== 'Pending') {
      this.errorHandler.showWarning('Transaction is already ' + transaction.status);
      return;
    }
    
    if (confirm(`Approve this expense of ₹${transaction.amount}?`)) {
      this.accountService.approveTransaction(transaction.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Transaction approved successfully');
            this.loadTransactions();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  deleteTransaction(transaction: Transaction): void {
    if (transaction.status === 'Approved') {
      this.errorHandler.showWarning('Cannot delete approved transactions');
      return;
    }
    
    if (confirm(`Delete this expense transaction?`)) {
      this.accountService.deleteTransaction(transaction.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Transaction deleted successfully');
            this.loadTransactions();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  onExport(format: string): void {
    this.errorHandler.showInfo(`Export expenses as ${format} - Feature coming soon`);
  }
}

