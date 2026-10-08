import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig } from '../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../services/library.service';
import { BookIssue, BorrowerType, CopyCondition } from '../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-circulation-desk',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './circulation-desk.component.html',
  styleUrls: ['./circulation-desk.component.scss']
})
export class CirculationDeskComponent implements OnInit {
  activeTab: 'issue' | 'return' | 'renew' | 'overdue' = 'issue';
  submitting = false;

  // Issue Form
  memberSearchTerm = '';
  memberOptions: any[] = [];
  issueForm: { borrower_type: BorrowerType; member_id: any; barcode: string; due_date: string; remarks: string } = {
    borrower_type: 'Student', member_id: null, barcode: '', due_date: '', remarks: ''
  };

  // Return Form
  returnForm: { barcode: string; copy_condition: CopyCondition; collect_fine: boolean; payment_method: string } = {
    barcode: '', copy_condition: 'Good', collect_fine: true, payment_method: 'Cash'
  };

  // Renew Loans
  activeLoans: BookIssue[] = [];
  renewLoading = false;
  renewConfig: TableConfig = {
    columns: [
      { key: 'book.title', header: 'Book Title', sortable: true },
      { key: 'borrower_name', header: 'Borrower', width: '160px' },
      { key: 'issue_date', header: 'Issue Date', width: '120px' },
      { key: 'due_date', header: 'Due Date', width: '120px' },
      { key: 'renewed_count', header: 'Renewals', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'autorenew', label: 'Renew (Extend)', color: 'primary', action: (row) => this.renewLoan(row) }
    ],
    pagination: true,
    showAddButton: false
  };

  // Overdue Loans
  overdueLoans: any[] = [];
  overdueLoading = false;
  overdueConfig: TableConfig = {
    columns: [
      { key: 'book.title', header: 'Book Title', sortable: true },
      { key: 'borrower_name', header: 'Borrower', width: '150px' },
      { key: 'borrower_type', header: 'Role', width: '90px', align: 'center' },
      { key: 'due_date', header: 'Due Date', width: '110px' },
      { key: 'days_overdue', header: 'Days Overdue', width: '110px', align: 'center' },
      { key: 'estimated_fine', header: 'Fine Accrued (₹)', width: '130px', align: 'right' }
    ],
    actions: [
      { icon: 'notifications_active', label: 'Send Notice', color: 'warn', action: (row) => this.sendReminder(row) }
    ],
    pagination: true,
    showAddButton: false
  };

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.onBorrowerTypeChange();
  }

  onBorrowerTypeChange(): void {
    this.memberOptions = [];
    this.issueForm.member_id = null;
  }

  searchMembers(): void {
    if (!this.memberSearchTerm.trim()) { return; }
    this.libraryService.getMembers({ role: this.issueForm.borrower_type, search: this.memberSearchTerm }).subscribe({
      next: (res) => {
        this.memberOptions = res.data || [];
        if (this.memberOptions.length > 0) {
          this.issueForm.member_id = this.memberOptions[0].id;
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  issueBook(): void {
    const branchId = this.auth.currentUser()?.branch_id || 1;
    this.submitting = true;
    this.libraryService.issueViaDesk({
      branch_id: branchId,
      member_id: this.issueForm.member_id,
      borrower_type: this.issueForm.borrower_type,
      barcode: this.issueForm.barcode.trim(),
      due_date: this.issueForm.due_date || undefined,
      remarks: this.issueForm.remarks || undefined
    }).subscribe({
      next: () => {
        alert(`Success! Book issued to member.`);
        this.issueForm.barcode = '';
        this.submitting = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.submitting = false;
      }
    });
  }

  returnBook(): void {
    if (!this.returnForm.barcode.trim()) { return; }
    this.submitting = true;
    this.libraryService.returnViaDesk({
      barcode: this.returnForm.barcode.trim(),
      copy_condition: this.returnForm.copy_condition,
      collect_fine: this.returnForm.collect_fine,
      payment_method: this.returnForm.payment_method
    }).subscribe({
      next: (res: any) => {
        let msg = `Book returned successfully!`;
        if (res.fine_amount > 0) {
          msg += ` Fine assessed: ₹${res.fine_amount}`;
        }
        if (res.reservation_held) {
          msg += ` (Note: Copy is now held for an active reservation!)`;
        }
        alert(msg);
        this.returnForm.barcode = '';
        this.submitting = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.submitting = false;
      }
    });
  }

  loadActiveForRenew(): void {
    this.renewLoading = true;
    this.libraryService.getActiveIssues().subscribe({
      next: (res) => {
        this.activeLoans = res.data || [];
        this.renewLoading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.renewLoading = false; }
    });
  }

  renewLoan(row: BookIssue): void {
    if (!confirm(`Renew loan for "${row.book?.title || 'Book'}"?`)) { return; }
    this.libraryService.renewBook(row.id).subscribe({
      next: () => {
        alert('Loan extended successfully!');
        this.loadActiveForRenew();
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  loadOverdue(): void {
    this.overdueLoading = true;
    this.libraryService.getOverdueDesk().subscribe({
      next: (res) => {
        this.overdueLoans = res.data || [];
        this.overdueLoading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.overdueLoading = false; }
    });
  }

  sendReminder(row: any): void {
    this.libraryService.sendOverdueReminder(row.id).subscribe({
      next: () => alert(`Overdue notice reminder sent to ${row.borrower_name}!`),
      error: (e) => this.errorHandler.showError(e)
    });
  }

  onRenewAction(_event: any): void {}
  onOverdueAction(_event: any): void {}
}
