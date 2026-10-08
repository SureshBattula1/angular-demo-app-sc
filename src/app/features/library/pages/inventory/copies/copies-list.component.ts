import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../../services/library.service';
import { Book, LibraryBookCopy, LibraryShelf, CopyCondition, CopyStatus } from '../../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-copies-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './copies-list.component.html',
  styleUrls: ['./copies-list.component.scss']
})
export class CopiesListComponent implements OnInit {
  loading = false;
  generating = false;
  copies: LibraryBookCopy[] = [];
  selectedCopy: LibraryBookCopy | null = null;
  showEditModal = false;
  showGenerateModal = false;

  books: Book[] = [];
  shelves: LibraryShelf[] = [];

  editForm: { condition: CopyCondition; status: CopyStatus; remarks: string } = {
    condition: 'Good',
    status: 'Available',
    remarks: ''
  };

  generateForm = {
    book_id: null as string | number | null,
    count: 1,
    shelf_id: null as string | number | null,
    condition: 'Good' as CopyCondition,
    purchase_price: null as number | null,
    vendor_name: '',
    barcode_prefix: 'BC',
    accession_prefix: 'ACC-',
    mode: 'auto' as 'auto' | 'custom',
    custom_barcodes: ''
  };

  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'accession_number', header: 'Accession #', sortable: true, width: '140px' },
      { key: 'barcode', header: 'Barcode', width: '130px' },
      { key: 'book.title', header: 'Book Title', sortable: true },
      { key: 'shelf.code', header: 'Shelf / Rack', width: '130px', align: 'center' },
      { key: 'condition', header: 'Condition', type: 'badge', width: '110px', align: 'center' },
      { key: 'status', header: 'Status', type: 'badge', width: '110px', align: 'center' },
      { key: 'copy_number', header: 'Copy #', width: '80px', align: 'center' }
    ],
    actions: [
      { icon: 'edit', label: 'Update Status', color: 'primary', action: (row) => this.openEditModal(row) }
    ],
    pagination: true,
    searchable: true,
    serverSide: true,
    totalCount: 0,
    showAddButton: true,
    primaryButtonLabel: 'GENERATE COPIES',
    addButtonPermission: 'library.create'
  };

  constructor(
    private libraryService: LibraryService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadCopies();
    this.loadBooksAndShelves();
  }

  loadCopies(): void {
    this.loading = true;
    this.libraryService.getCopies(this.filters).subscribe({
      next: (res) => {
        this.copies = res.data || [];
        if (res.meta) { this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total }; }
        this.loading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  loadBooksAndShelves(): void {
    this.libraryService.getBooks({ per_page: 250 }).subscribe({
      next: (res) => { this.books = res.data || []; },
      error: () => { this.books = []; }
    });

    this.libraryService.getShelves({ per_page: 250 }).subscribe({
      next: (res) => { this.shelves = res.data || []; },
      error: () => { this.shelves = []; }
    });
  }

  onAction(event: { action: string; row: unknown }): void {
    if (event.action === 'add') {
      this.openGenerateModal();
    }
  }

  onPaginationChange(e: PaginationEvent): void {
    this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize };
    this.loadCopies();
  }

  onSearch(term: string): void {
    this.filters = { ...this.filters, search: term, page: 1 };
    this.loadCopies();
  }

  openGenerateModal(): void {
    this.generateForm = {
      book_id: this.books.length > 0 ? this.books[0].id : null,
      count: 1,
      shelf_id: null,
      condition: 'Good',
      purchase_price: null,
      vendor_name: '',
      barcode_prefix: 'BC',
      accession_prefix: 'ACC-',
      mode: 'auto' as 'auto' | 'custom',
      custom_barcodes: ''
    };
    this.showGenerateModal = true;
  }

  closeGenerateModal(): void {
    this.showGenerateModal = false;
  }

  submitGenerateCopies(): void {
    if (!this.generateForm.book_id) {
      this.errorHandler.showError('Please select a book.');
      return;
    }

    let copiesPayload: Record<string, unknown>[] | undefined;
    let countToGenerate = Number(this.generateForm.count) || 1;

    if (this.generateForm.mode === 'custom') {
      const lines: string[] = (this.generateForm.custom_barcodes || '')
        .split(/[\n,]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => Boolean(s));

      if (lines.length === 0) {
        this.errorHandler.showError('Please enter or scan at least one barcode sticker.');
        return;
      }

      countToGenerate = lines.length;
      copiesPayload = lines.map((bc: string) => ({
        barcode: bc,
        shelf_id: this.generateForm.shelf_id,
        condition: this.generateForm.condition,
        purchase_price: this.generateForm.purchase_price
      }));
    } else {
      if (!this.generateForm.count || this.generateForm.count < 1) {
        this.errorHandler.showError('Please enter at least 1 copy.');
        return;
      }
    }

    this.generating = true;
    this.libraryService.batchGenerateCopies({
      book_id: this.generateForm.book_id,
      count: countToGenerate,
      shelf_id: this.generateForm.shelf_id,
      condition: this.generateForm.condition,
      purchase_price: this.generateForm.purchase_price,
      vendor_name: this.generateForm.vendor_name || null,
      barcode_prefix: (this.generateForm.barcode_prefix || 'BC').trim(),
      accession_prefix: (this.generateForm.accession_prefix || 'ACC-').trim(),
      ...(copiesPayload ? { copies: copiesPayload } : {})
    }).subscribe({
      next: (res) => {
        this.generating = false;
        if (res.success) {
          this.errorHandler.showSuccess(`Generated ${countToGenerate} copy/copies with Barcodes & Accession numbers!`);
          this.closeGenerateModal();
          this.loadCopies();
        } else {
          this.errorHandler.showError(res.message || 'Failed to generate copies');
        }
      },
      error: (e) => {
        this.generating = false;
        this.errorHandler.showError(e);
      }
    });
  }

  openEditModal(copy: LibraryBookCopy): void {
    this.selectedCopy = copy;
    this.editForm = {
      condition: copy.condition,
      status: copy.status,
      remarks: copy.remarks || ''
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveCopyDetails(): void {
    if (!this.selectedCopy) { return; }
    this.libraryService.updateCopy(this.selectedCopy.id, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Copy updated successfully');
          this.closeEditModal();
          this.loadCopies();
        } else {
          this.errorHandler.showError(res.message || 'Failed to update copy');
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
