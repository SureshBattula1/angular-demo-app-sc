import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { LibraryService } from '../../services/library.service';
import { Book } from '../../../../core/models/book.model';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { IssueBookDialogComponent } from '../issue-book-dialog/issue-book-dialog.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      [data]="books"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Library Books'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)"
      (searchResetEvent)="onSearchReset()">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class BookListComponent implements OnInit {
  loading = false;
  books: Book[] = [];
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'title', header: 'Title', sortable: true, searchable: true },
      { key: 'author', header: 'Author', sortable: true, width: '160px' },
      { key: 'category', header: 'Category', type: 'badge', width: '130px', align: 'center' },
      { key: 'isbn', header: 'ISBN', width: '140px' },
      { key: 'branch.name', header: 'Branch', sortable: true, width: '160px' },
      { key: 'total_copies', header: 'Total', width: '80px', align: 'center' },
      { key: 'available_copies', header: 'Available', width: '100px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View', action: (row) => this.viewBook(row), permission: 'library.view' },
      {
        icon: 'assignment_return', label: 'Issue', color: 'primary',
        action: (row) => this.openIssueDialog(row),
        permission: 'library.issue',
        show: (row) => (row.available_copies ?? 0) > 0
      },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editBook(row), permission: 'library.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteBook(row), permission: 'library.delete' }
    ],
    selectable: false,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    addButtonPermission: 'library.create',
    primaryButtonLabel: 'ADD BOOK'
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Book Search',
    width: '460px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      { key: 'branch_id', label: 'Branch', type: 'select', icon: 'business', placeholder: 'Select branch', options: [] },
      { key: 'category', label: 'Category', type: 'text', icon: 'category', placeholder: 'e.g. Programming' },
      {
        key: 'available_only', label: 'Availability', type: 'select', icon: 'inventory_2',
        options: [{ value: 'true', label: 'Available only' }]
      }
    ]
  };

  constructor(
    private libraryService: LibraryService,
    private branchService: BranchService,
    private router: Router,
    private dialog: MatDialog,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadBranchOptions();
    this.loadBooks();
  }

  private loadBranchOptions(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (res) => {
        const field = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
        if (field) {
          field.options = (res.success && res.data) ? res.data.map(b => ({ value: b.id.toString(), label: b.name })) : [];
        }
      },
      error: () => { /* leave empty */ }
    });
  }

  loadBooks(): void {
    this.loading = true;
    this.libraryService.getBooks({ ...this.filters }).subscribe({
      next: (res) => {
        this.books = res.data || [];
        if (res.meta) {
          this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total };
        }
        this.loading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  onPaginationChange(e: PaginationEvent): void {
    this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize };
    this.loadBooks();
  }

  onSortChange(e: SortEvent): void {
    const map: Record<string, string> = {
      'title': 'books.title', 'author': 'books.author', 'category': 'books.category',
      'branch.name': 'branches.name', 'total_copies': 'books.total_copies', 'available_copies': 'books.available_copies'
    };
    this.filters = { ...this.filters, sort_by: map[e.field] || e.field, sort_direction: e.direction };
    this.loadBooks();
  }

  onAdvancedSearchChange(e: SearchEvent): void {
    this.filters = { ...e.filters, search: e.query, page: 1 };
    this.loadBooks();
  }

  onSearchReset(): void {
    this.filters = {};
    this.loadBooks();
  }

  onAction(event: { action: string; row: Book | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/library/books/create']);
    }
  }

  private viewBook(book: Book): void {
    this.router.navigate(['/library/books/view', book.id]);
  }

  private editBook(book: Book): void {
    this.router.navigate(['/library/books/edit', book.id]);
  }

  private openIssueDialog(book: Book): void {
    const ref = this.dialog.open(IssueBookDialogComponent, { data: book, width: '640px', maxWidth: '95vw' });
    ref.afterClosed().subscribe((issued: boolean) => {
      if (issued) {
        this.loadBooks();
      }
    });
  }

  private deleteBook(book: Book): void {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) {
      return;
    }
    this.libraryService.deleteBook(book.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Book deleted');
          this.loadBooks();
        } else {
          this.errorHandler.showError(res.message || 'Failed to delete book');
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
