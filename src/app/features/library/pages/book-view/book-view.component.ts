import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { LibraryService } from '../../services/library.service';
import { Book, BookIssue } from '../../../../core/models/book.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ReturnBookDialogComponent } from '../return-book-dialog/return-book-dialog.component';

@Component({
  selector: 'app-book-view',
  standalone: true,
  imports: [CommonModule, MaterialModule, HasPermissionDirective],
  templateUrl: './book-view.component.html',
  styleUrls: ['./book-view.component.scss']
})
export class BookViewComponent implements OnInit {
  book: Book | null = null;
  bookIssues: BookIssue[] = [];
  loading = false;
  historyLoading = false;

  displayedIssueColumns = ['member', 'type', 'issue_date', 'due_date', 'return_date', 'duration', 'status', 'fine', 'actions'];

  private bookId!: string;

  constructor(
    private libraryService: LibraryService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.bookId = params['id']; // opaque hashid — never Number() it
        this.loadBook();
        this.loadHistory();
      }
    });
  }

  private loadBook(): void {
    this.loading = true;
    this.libraryService.getBook(this.bookId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.book = res.data;
        }
        this.loading = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loading = false;
        this.router.navigate(['/library']);
      }
    });
  }

  private loadHistory(): void {
    this.historyLoading = true;
    this.libraryService.getBookHistory(this.bookId).subscribe({
      next: (res) => {
        this.bookIssues = res.data || [];
        this.historyLoading = false;
      },
      error: () => { this.bookIssues = []; this.historyLoading = false; }
    });
  }

  /** Copies currently out on loan. */
  get issuedCount(): number {
    if (!this.book) {
      return 0;
    }
    return Math.max(0, (this.book.total_copies ?? 0) - (this.book.available_copies ?? 0));
  }

  /** Active loans that are past their due date. */
  get overdueCount(): number {
    const today = this.startOfToday();
    return this.bookIssues.filter(i => i.status === 'Issued' && i.due_date && new Date(i.due_date) < today).length;
  }

  /** Loans currently out (not yet returned). */
  get historyIssued(): number {
    return this.bookIssues.filter(i => i.status === 'Issued').length;
  }

  /** Total fines accrued across this book's history. */
  get historyFines(): number {
    return this.bookIssues.reduce((sum, i) => sum + (Number(i.fine_amount) || 0), 0);
  }

  /** Status label used for the badge (Issued + past due => Overdue). */
  displayStatus(i: BookIssue): string {
    if (i.status === 'Issued' && i.due_date && new Date(i.due_date) < this.startOfToday()) {
      return 'Overdue';
    }
    return i.status;
  }

  getIssueStatusClass(i: BookIssue): string {
    return this.displayStatus(i).toLowerCase(); // issued | returned | overdue | lost
  }

  /** Human-readable time the copy was/has been held. */
  duration(i: BookIssue): string {
    if (!i.issue_date) {
      return '—';
    }
    const start = new Date(i.issue_date).getTime();
    const end = i.return_date ? new Date(i.return_date).getTime() : Date.now();
    const days = Math.max(0, Math.round((end - start) / 86400000));
    return i.return_date ? `${days} day${days === 1 ? '' : 's'}` : `${days} day${days === 1 ? '' : 's'} (ongoing)`;
  }

  /** True for loans still out (returnable). */
  isActive(i: BookIssue): boolean {
    return i.status === 'Issued';
  }

  openReturnDialog(i: BookIssue): void {
    const ref = this.dialog.open(ReturnBookDialogComponent, {
      data: { issue: i, bookTitle: this.book?.title ?? '' },
      width: '480px',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe((done: boolean) => {
      if (done) {
        this.loadBook();
        this.loadHistory();
      }
    });
  }

  onEdit(): void {
    if (this.book) {
      this.router.navigate(['/library/books/edit', this.book.id]);
    }
  }

  onDelete(): void {
    if (!this.book) {
      return;
    }
    if (!confirm(`Delete "${this.book.title}"? This cannot be undone.`)) {
      return;
    }
    this.libraryService.deleteBook(this.book.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Book deleted');
          this.router.navigate(['/library']);
        } else {
          this.errorHandler.showError(res.message || 'Failed to delete book');
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  onBack(): void {
    this.router.navigate(['/library']);
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
