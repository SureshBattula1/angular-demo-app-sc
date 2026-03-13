import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AccountService } from '../../services/account.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ExportService } from '../../../../shared/services/export.service';
import { Transaction } from '../../../../core/models/account.model';

@Component({
  selector: 'app-income-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="transactions"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Income Transactions'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class IncomeListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  transactions: Transaction[] = [];
  selectedTransactions: Transaction[] = [];
  currentFilters: Record<string, unknown> = { type: 'Income' };
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'transaction_number', header: 'Transaction #', sortable: true, searchable: true, width: '150px' },
      { key: 'transaction_date', header: 'Date', type: 'date', sortable: true, width: '120px' },
      { key: 'category.name', header: 'Category', sortable: true, searchable: true },
      { key: 'description', header: 'Description', searchable: true },
      { key: 'party_name', header: 'From', searchable: true, width: '150px' },
      { key: 'payment_method', header: 'Method', width: '120px' },
      { key: 'amount', header: 'Amount', type: 'number', align: 'right', width: '130px' },
      { key: 'status', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewTransaction(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editTransaction(row) },
      { icon: 'check_circle', label: 'Approve', color: 'accent', action: (row) => this.approveTransaction(row), show: (row) => (row?.status ?? '') === 'Pending' },
      { icon: 'download', label: 'Download Receipt', color: 'primary', action: (row) => this.downloadReceipt(row) }
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
    defaultPageSize: 25
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Income Search',
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
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService
  ) {}
  
  ngOnInit(): void {
    this.loadTransactions();
    this.loadCategories();
  }
  
  loadTransactions(): void {
    this.loading = true;
    
    this.accountService.getTransactions(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.transactions = response.data || [];
          if (response.meta) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.meta.total };
          } else {
            this.tableConfig = { ...this.tableConfig, totalCount: this.transactions.length };
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }
  
  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };
    this.loadTransactions();
  }
  
  onSortChange(event: SortEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: event.field,
      sort_direction: event.direction
    };
    this.loadTransactions();
  }
  
  loadCategories(): void {
    this.accountService.getCategories({ type: 'Income', is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const categoryField = this.advancedSearchConfig.fields.find(f => f.key === 'category_id');
          if (categoryField) {
            categoryField.options = response.data.map(c => ({ value: c.id, label: c.name }));
          }
        }
      },
    });
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadTransactions();
  }
  
  onAction(event: { action: string, row: Transaction | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/accounts/transactions/create'], {
        queryParams: { type: 'Income' }
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
  
  downloadReceipt(transaction: Transaction): void {
    if (transaction.status !== 'Approved') {
      this.errorHandler.showWarning('Receipt is only available for approved transactions.');
      return;
    }
    this.errorHandler.showInfo('Preparing receipt PDF...');
    this.accountService.downloadTransactionReceipt(transaction.id).subscribe({
      next: (blob: Blob) => {
        const fileName = (transaction.transaction_number ? `income-receipt-${transaction.transaction_number}` : `income-receipt-${transaction.id}`).replace(/[#\s]/g, '-') + '.pdf';
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
        this.errorHandler.showSuccess('Receipt downloaded.');
      },
      error: (err) => this.errorHandler.showError(err)
    });
  }

  approveTransaction(transaction: Transaction): void {
    if (transaction.status !== 'Pending') {
      this.errorHandler.showWarning('Transaction is already ' + transaction.status);
      return;
    }
    
    if (confirm(`Approve this income transaction of ₹${transaction.amount}?`)) {
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
  
  onExport(format: 'excel' | 'pdf' | 'csv'): void {
    // Show loading message
    this.errorHandler.showInfo(`Exporting income transactions as ${format.toUpperCase()}...`);
    
    // Call export service with current filters and type
    this.exportService.export(
      {
        endpoint: '/transactions/export',
        filename: 'income_transactions'
      },
      {
        format: format,
        filters: {
          ...this.currentFilters,
          type: 'Income'  // Ensure we export income transactions only
        }
      }
    );
  }
}

