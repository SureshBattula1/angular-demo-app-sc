import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../../services/library.service';
import { LibraryShelf } from '../../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-shelves-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './shelves-list.component.html',
  styleUrls: ['./shelves-list.component.scss']
})
export class ShelvesListComponent implements OnInit {
  loading = false;
  shelves: LibraryShelf[] = [];
  showModal = false;
  editItem: LibraryShelf | null = null;
  formData: { rack_number: string; shelf_number: string; floor: string; room: string; capacity: number } = {
    rack_number: '', shelf_number: '', floor: '', room: '', capacity: 50
  };
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'shelf_code', header: 'Shelf Code', sortable: true, width: '130px' },
      { key: 'rack_number', header: 'Rack #', width: '110px' },
      { key: 'shelf_number', header: 'Shelf #', width: '110px' },
      { key: 'floor', header: 'Floor', width: '110px' },
      { key: 'room', header: 'Room / Section', width: '140px' },
      { key: 'capacity', header: 'Capacity', width: '100px', align: 'center' },
      { key: 'current_books_count', header: 'Current Books', width: '120px', align: 'center' }
    ],
    actions: [
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.openEditModal(row), permission: 'library.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteShelf(row), permission: 'library.delete' }
    ],
    pagination: true,
    serverSide: true,
    totalCount: 0,
    addButtonPermission: 'library.create',
    primaryButtonLabel: 'ADD SHELF'
  };

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadShelves();
  }

  loadShelves(): void {
    this.loading = true;
    this.libraryService.getShelves(this.filters).subscribe({
      next: (res) => {
        this.shelves = res.data || [];
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
    this.loadShelves();
  }

  openAddModal(): void {
    this.editItem = null;
    this.formData = { rack_number: '', shelf_number: '', floor: '', room: '', capacity: 50 };
    this.showModal = true;
  }

  openEditModal(item: LibraryShelf): void {
    this.editItem = item;
    this.formData = {
      rack_number: item.rack_number,
      shelf_number: item.shelf_number || '',
      floor: item.floor || '',
      room: item.room || '',
      capacity: item.capacity || 50
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveShelf(): void {
    const branchId = this.auth.currentUser()?.branch_id || 1;
    if (this.editItem) {
      this.libraryService.updateShelf(this.editItem.id, this.formData).subscribe({
        next: () => { this.closeModal(); this.loadShelves(); },
        error: (e) => this.errorHandler.showError(e)
      });
    } else {
      this.libraryService.createShelf({ ...this.formData, branch_id: branchId }).subscribe({
        next: () => { this.closeModal(); this.loadShelves(); },
        error: (e) => this.errorHandler.showError(e)
      });
    }
  }

  deleteShelf(shelf: LibraryShelf): void {
    const label = shelf.shelf_code || shelf.rack_number;
    if (!confirm(`Delete shelf "${label}"?`)) { return; }
    this.libraryService.deleteShelf(shelf.id).subscribe({
      next: () => this.loadShelves(),
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
