import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../services/library.service';
import { BookIssue } from '../../../../core/models/book.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-book-issues',
  standalone: true,
  imports: [CommonModule, MaterialModule, DataTableComponent],
  templateUrl: './book-issues.component.html',
  styles: [`:host { display: block; } .issues-page { padding: 24px; } @media (max-width:600px){ .issues-page{padding:12px;} }`]
})
export class BookIssuesComponent implements OnInit {
  activeLoading = false;
  overdueLoading = false;
  activeIssues: BookIssue[] = [];
  overdueIssues: BookIssue[] = [];

  private activeFilters: Record<string, unknown> = {};
  private overdueFilters: Record<string, unknown> = {};

  activeConfig: TableConfig = this.buildConfig();
  overdueConfig: TableConfig = this.buildConfig();

  constructor(
    private libraryService: LibraryService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadActive();
    this.loadOverdue();
  }

  private buildConfig(): TableConfig {
    return {
      columns: [
        { key: 'book_title', header: 'Book', sortable: true },
        { key: 'member_name', header: 'Member', width: '180px' },
        { key: 'borrower_type', header: 'Type', type: 'badge', width: '110px', align: 'center' },
        { key: 'branch_name', header: 'Branch', width: '160px' },
        { key: 'issue_date', header: 'Issued', width: '120px' },
        { key: 'due_date', header: 'Due', sortable: true, width: '120px' }
      ],
      actions: [
        { icon: 'assignment_returned', label: 'Return', color: 'primary', action: (row) => this.returnBook(row), permission: 'library.return' }
      ],
      selectable: false,
      pagination: true,
      searchable: false,
      responsive: true,
      serverSide: true,
      totalCount: 0,
      showAddButton: false,
      pageSizeOptions: [10, 25, 50, 100],
      defaultPageSize: 25
    };
  }

  loadActive(): void {
    this.activeLoading = true;
    this.libraryService.getActiveIssues({ ...this.activeFilters }).subscribe({
      next: (res) => {
        this.activeIssues = res.data || [];
        if (res.meta) { this.activeConfig = { ...this.activeConfig, totalCount: res.meta.total }; }
        this.activeLoading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.activeLoading = false; }
    });
  }

  loadOverdue(): void {
    this.overdueLoading = true;
    this.libraryService.getOverdueIssues({ ...this.overdueFilters }).subscribe({
      next: (res) => {
        this.overdueIssues = res.data || [];
        if (res.meta) { this.overdueConfig = { ...this.overdueConfig, totalCount: res.meta.total }; }
        this.overdueLoading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.overdueLoading = false; }
    });
  }

  onActivePage(e: PaginationEvent): void {
    this.activeFilters = { ...this.activeFilters, page: e.page + 1, per_page: e.pageSize };
    this.loadActive();
  }

  onOverduePage(e: PaginationEvent): void {
    this.overdueFilters = { ...this.overdueFilters, page: e.page + 1, per_page: e.pageSize };
    this.loadOverdue();
  }

  private returnBook(issue: BookIssue): void {
    if (!confirm(`Return "${issue.book_title}" from ${issue.member_name}?`)) {
      return;
    }
    this.libraryService.returnBook(issue.id).subscribe({
      next: (res) => {
        if (res.success) {
          const fine = (res as { fine_amount?: number }).fine_amount;
          this.errorHandler.showSuccess(fine ? `Returned. Late fine: ₹${fine}` : 'Book returned');
          this.loadActive();
          this.loadOverdue();
        } else {
          this.errorHandler.showError(res.message || 'Failed to return book');
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
