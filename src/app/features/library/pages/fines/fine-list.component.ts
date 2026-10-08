import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../services/library.service';
import { LibraryFine } from '../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-fine-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './fine-list.component.html',
  styleUrls: ['./fine-list.component.scss']
})
export class FineListComponent implements OnInit {
  loading = false;
  fines: LibraryFine[] = [];
  summary: any = null;

  selectedFine: LibraryFine | null = null;
  showPayModal = false;
  payAmount = 0;
  payMethod = 'Cash';
  payRef = '';

  showWaiveModal = false;
  waiveReason = '';

  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'member.first_name', header: 'Member', sortable: true },
      { key: 'issue.book.title', header: 'Book Title' },
      { key: 'type', header: 'Fine Type', width: '130px' },
      { key: 'amount', header: 'Amount (₹)', width: '110px', align: 'right' },
      { key: 'paid_amount', header: 'Paid (₹)', width: '100px', align: 'right' },
      { key: 'status', header: 'Status', type: 'badge', width: '110px', align: 'center' },
      { key: 'payment_method', header: 'Payment Method', width: '130px' },
      { key: 'created_at', header: 'Date', width: '120px' }
    ],
    actions: [
      { icon: 'payments', label: 'Collect', color: 'primary', action: (row) => this.openPayModal(row), show: (row) => row.status !== 'Paid' && row.status !== 'Waived' },
      { icon: 'handshake', label: 'Waive', color: 'warn', action: (row) => this.openWaiveModal(row), show: (row) => row.status !== 'Paid' && row.status !== 'Waived' }
    ],
    pagination: true,
    serverSide: true,
    totalCount: 0,
    showAddButton: false
  };

  constructor(
    private libraryService: LibraryService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadFines();
  }

  loadFines(): void {
    this.loading = true;
    this.libraryService.getFines(this.filters).subscribe({
      next: (res: any) => {
        this.fines = res.data || [];
        this.summary = res.summary || null;
        if (res.meta) { this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total }; }
        this.loading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  onAction(_event: any): void {}

  onPaginationChange(e: PaginationEvent): void {
    this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize };
    this.loadFines();
  }

  openPayModal(fine: LibraryFine): void {
    this.selectedFine = fine;
    this.payAmount = (fine.amount || 0) - (fine.paid_amount || 0);
    this.payMethod = 'Cash';
    this.payRef = '';
    this.showPayModal = true;
  }

  closePayModal(): void {
    this.showPayModal = false;
  }

  submitPayment(): void {
    if (!this.selectedFine) { return; }
    this.libraryService.payFine(this.selectedFine.id, {
      amount: this.payAmount,
      payment_method: this.payMethod,
      transaction_reference: this.payRef
    }).subscribe({
      next: () => {
        this.closePayModal();
        this.loadFines();
      },
      error: (e: any) => this.errorHandler.showError(e)
    });
  }

  openWaiveModal(fine: LibraryFine): void {
    this.selectedFine = fine;
    this.waiveReason = '';
    this.showWaiveModal = true;
  }

  closeWaiveModal(): void {
    this.showWaiveModal = false;
  }

  submitWaiver(): void {
    if (!this.selectedFine || !this.waiveReason.trim()) { return; }
    this.libraryService.waiveFine(this.selectedFine.id, {
      waived_reason: this.waiveReason.trim()
    }).subscribe({
      next: () => {
        this.closeWaiveModal();
        this.loadFines();
      },
      error: (e: any) => this.errorHandler.showError(e)
    });
  }
}
