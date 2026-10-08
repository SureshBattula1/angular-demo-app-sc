import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../services/library.service';
import { LibraryReservation, BorrowerType } from '../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent implements OnInit {
  loading = false;
  reservations: LibraryReservation[] = [];
  showModal = false;

  memberSearch = '';
  memberList: any[] = [];
  bookSearch = '';
  bookList: any[] = [];

  formData: { borrower_type: BorrowerType; member_id: any; book_id: any; notes: string } = {
    borrower_type: 'Student',
    member_id: null,
    book_id: null,
    notes: ''
  };

  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'book.title', header: 'Book Title', sortable: true },
      { key: 'member.first_name', header: 'Member', sortable: true },
      { key: 'borrower_type', header: 'Type', width: '90px', align: 'center' },
      { key: 'reservation_date', header: 'Hold Date', width: '110px' },
      { key: 'queue_position', header: 'Queue #', width: '90px', align: 'center' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' },
      { key: 'expiry_date', header: 'Expires', width: '110px' }
    ],
    actions: [
      {
        icon: 'cancel',
        label: 'Cancel Hold',
        color: 'warn',
        action: (row) => this.cancelReservation(row),
        show: (row) => row.status === 'Pending' || row.status === 'Available'
      },
      {
        icon: 'check_circle',
        label: 'Fulfill (Issue)',
        color: 'primary',
        action: (row) => this.fulfillReservation(row),
        show: (row) => row.status === 'Available'
      }
    ],
    pagination: true,
    serverSide: true,
    totalCount: 0,
    addButtonPermission: 'library.create',
    primaryButtonLabel: 'PLACE HOLD'
  };

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.libraryService.getReservations(this.filters).subscribe({
      next: (res) => {
        this.reservations = res.data || [];
        if (res.meta) { this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total }; }
        this.loading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  onAction(event: any): void {
    if (event.action === 'add') {
      this.openAddModal();
    }
  }

  onPaginationChange(e: PaginationEvent): void {
    this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize };
    this.loadReservations();
  }

  openAddModal(): void {
    this.formData = { borrower_type: 'Student', member_id: null, book_id: null, notes: '' };
    this.memberList = [];
    this.bookList = [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onTypeChange(): void {
    this.memberList = [];
    this.formData.member_id = null;
  }

  searchMembers(): void {
    if (!this.memberSearch.trim()) { return; }
    this.libraryService.getMembers({ role: this.formData.borrower_type, search: this.memberSearch }).subscribe({
      next: (res) => {
        this.memberList = res.data || [];
        if (this.memberList.length > 0) { this.formData.member_id = this.memberList[0].id; }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  searchBooks(): void {
    if (!this.bookSearch.trim()) { return; }
    this.libraryService.getBooks({ search: this.bookSearch, per_page: 10 }).subscribe({
      next: (res: any) => {
        this.bookList = res.data || [];
        if (this.bookList.length > 0) { this.formData.book_id = this.bookList[0].id; }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  saveReservation(): void {
    const branchId = this.auth.currentUser()?.branch_id || 1;
    this.libraryService.createReservation({ ...this.formData, branch_id: branchId }).subscribe({
      next: () => { this.closeModal(); this.loadReservations(); },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  cancelReservation(row: LibraryReservation): void {
    if (!confirm('Cancel this book hold?')) { return; }
    this.libraryService.cancelReservation(row.id).subscribe({
      next: () => this.loadReservations(),
      error: (e) => this.errorHandler.showError(e)
    });
  }

  fulfillReservation(row: LibraryReservation): void {
    this.libraryService.fulfillReservation(row.id).subscribe({
      next: () => { alert('Reservation fulfilled into active loan!'); this.loadReservations(); },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
