import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { LibraryService } from '../../services/library.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Book, BorrowerType } from '../../../../core/models/book.model';

interface MemberOption {
  userId: string | number;   // users.id — the value the API expects (member_id)
  label: string;
}

@Component({
  selector: 'app-issue-book-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './issue-book-dialog.component.html',
  styleUrls: ['./issue-book-dialog.component.scss']
})
export class IssueBookDialogComponent {
  borrowerType: BorrowerType = 'Student';
  searchTerm = '';
  members: MemberOption[] = [];
  selectedMemberId: string | number | null = null;
  dueDate: Date | null = null;
  searching = false;
  submitting = false;

  constructor(
    private dialogRef: MatDialogRef<IssueBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public book: Book,
    private libraryService: LibraryService,
    private studentService: StudentCrudService,
    private teacherService: TeacherService,
    private errorHandler: ErrorHandlerService
  ) {}

  onBorrowerTypeChange(): void {
    this.members = [];
    this.selectedMemberId = null;
  }

  searchMembers(): void {
    const term = this.searchTerm.trim();
    if (term.length < 2) {
      return;
    }
    this.searching = true;
    this.selectedMemberId = null;

    if (this.borrowerType === 'Student') {
      this.studentService.getStudents({ search: term, per_page: 25 }).subscribe({
        next: (res) => {
          this.members = (res.data || []).map((s: any) => ({
            userId: s.user_id,
            label: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() + (s.admission_number ? ` (${s.admission_number})` : '')
          })).filter((m: MemberOption) => m.userId != null);
          this.searching = false;
        },
        error: (e) => { this.errorHandler.showError(e); this.searching = false; }
      });
    } else {
      this.teacherService.getTeachers({ search: term, per_page: 25 }).subscribe({
        next: (res: any) => {
          this.members = (res.data || []).map((t: any) => ({
            userId: t.user?.id ?? t.user_id,
            label: `${t.user?.first_name ?? ''} ${t.user?.last_name ?? ''}`.trim() + (t.employee_id ? ` (${t.employee_id})` : '')
          })).filter((m: MemberOption) => m.userId != null);
          this.searching = false;
        },
        error: (e: any) => { this.errorHandler.showError(e); this.searching = false; }
      });
    }
  }

  issue(): void {
    if (!this.selectedMemberId) {
      return;
    }
    this.submitting = true;
    const due = this.dueDate ? this.formatDate(this.dueDate) : undefined;
    this.libraryService.issueBook(this.book.id, this.selectedMemberId, this.borrowerType, due).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.errorHandler.showSuccess('Book issued successfully');
          this.dialogRef.close(true);
        } else {
          this.errorHandler.showError(res.message || 'Failed to issue book');
        }
      },
      error: (e) => { this.errorHandler.showError(e); this.submitting = false; }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  /** Local yyyy-MM-dd (avoids UTC shift from toISOString). */
  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
