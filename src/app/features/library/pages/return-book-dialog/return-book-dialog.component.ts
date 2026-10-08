import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { LibraryService } from '../../services/library.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { BookIssue } from '../../../../core/models/book.model';

export interface ReturnDialogData {
  issue: BookIssue;
  bookTitle: string;
}

/** Late fine per overdue day (matches the server LOAN_RULES: ₹5/day for all borrowers). */
const FINE_PER_DAY = 5;

@Component({
  selector: 'app-return-book-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './return-book-dialog.component.html',
  styleUrls: ['./return-book-dialog.component.scss']
})
export class ReturnBookDialogComponent {
  collectFine = true;
  submitting = false;

  constructor(
    private dialogRef: MatDialogRef<ReturnBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReturnDialogData,
    private libraryService: LibraryService,
    private errorHandler: ErrorHandlerService
  ) {}

  get daysOverdue(): number {
    const due = this.data.issue.due_date ? new Date(this.data.issue.due_date) : null;
    if (!due) {
      return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86400000));
  }

  get fine(): number {
    return this.daysOverdue * FINE_PER_DAY;
  }

  confirm(): void {
    this.submitting = true;
    // Only collect when there is a fine to collect.
    const collect = this.fine > 0 ? this.collectFine : false;
    this.libraryService.returnBook(this.data.issue.id, collect).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          const fine = (res as { fine_amount?: number }).fine_amount ?? this.fine;
          this.errorHandler.showSuccess(
            fine > 0
              ? (collect ? `Returned. Fine ₹${fine} collected.` : `Returned. Fine ₹${fine} pending.`)
              : 'Book returned successfully'
          );
          this.dialogRef.close(true);
        } else {
          this.errorHandler.showError(res.message || 'Failed to return book');
        }
      },
      error: (e) => { this.errorHandler.showError(e); this.submitting = false; }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
