import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { AccountService } from '../../services/account.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AccountCategory } from '../../../../core/models/account.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-account-category-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="categories"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Account Categories'"
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
export class AccountCategoryListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  categories: AccountCategory[] = [];
  selectedCategories: AccountCategory[] = [];
  currentFilters: Record<string, unknown> = {};
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'name', header: 'Category Name', sortable: true, searchable: true },
      { key: 'code', header: 'Code', sortable: true, searchable: true, width: '120px' },
      { key: 'type', header: 'Type', type: 'badge', sortable: true, width: '110px', align: 'center' },
      { key: 'sub_type', header: 'Sub Type', sortable: true, width: '150px' },
      { key: 'description', header: 'Description' },
      { key: 'is_active', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewCategory(row), permission: 'accounts.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editCategory(row), permission: 'accounts.edit' },
      { 
        icon: 'toggle_on', 
        label: 'Toggle Status', 
        color: 'accent', 
        action: (row) => this.toggleStatus(row), 
        permission: 'accounts.edit',
        show: (row) => row.is_active
      },
      { 
        icon: 'toggle_off', 
        label: 'Toggle Status', 
        color: 'warn', 
        action: (row) => this.toggleStatus(row), 
        permission: 'accounts.edit',
        show: (row) => !row.is_active
      },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteCategory(row), permission: 'accounts.delete' }
    ],
    selectable: true,
    pagination: false,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    addButtonPermission: 'accounts.create'
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Category Search',
    width: '400px',
    showReset: true,
    showSaveSearch: false,
    fields: [
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
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadCategories();
  }
  
  loadCategories(): void {
    this.loading = true;
    
    this.accountService.getCategories(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading = false;
      }
    });
  }
  
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
  
  toggleStatus(category: AccountCategory): void {
    this.accountService.toggleCategoryStatus(category.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Category status updated successfully', 'Close', { duration: 3000 });
          this.loadCategories();
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }
  
  onAction(event: { action: string; row: AccountCategory }): void {
    if (event.action === 'add') {
      this.router.navigate(['/accounts/categories/new']);
    }
  }
  
  onRowClick(category: AccountCategory): void {
    this.viewCategory(category);
  }
  
  onSelectionChange(selected: AccountCategory[]): void {
    this.selectedCategories = selected;
  }
  
  onExport(format: string): void {
    // Implement export logic when needed
  }
  
  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = { ...this.currentFilters, ...event };
    this.loadCategories();
  }
  
  onSortChange(event: SortEvent): void {
    this.currentFilters = { ...this.currentFilters, sort_by: event.field, sort_order: event.direction };
    this.loadCategories();
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = { ...event.filters };
    this.loadCategories();
  }
}

