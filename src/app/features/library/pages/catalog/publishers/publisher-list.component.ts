import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../../services/library.service';
import { LibraryPublisher } from '../../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-publisher-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './publisher-list.component.html',
  styleUrls: ['./publisher-list.component.scss']
})
export class PublisherListComponent implements OnInit {
  loading = false;
  publishers: LibraryPublisher[] = [];
  showModal = false;
  editItem: LibraryPublisher | null = null;
  formData: { name: string; contact_person: string; email: string; phone: string } = {
    name: '', contact_person: '', email: '', phone: ''
  };
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'name', header: 'Publisher Name', sortable: true },
      { key: 'contact_person', header: 'Contact Person', width: '160px' },
      { key: 'email', header: 'Email', width: '180px' },
      { key: 'phone', header: 'Phone', width: '140px' },
      { key: 'books_count', header: 'Titles', width: '100px', align: 'center' }
    ],
    actions: [
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.openEditModal(row), permission: 'library.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deletePublisher(row), permission: 'library.delete' }
    ],
    pagination: true,
    searchable: true,
    serverSide: true,
    totalCount: 0,
    addButtonPermission: 'library.create',
    primaryButtonLabel: 'ADD PUBLISHER'
  };

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadPublishers();
  }

  loadPublishers(): void {
    this.loading = true;
    this.libraryService.getPublishers(this.filters).subscribe({
      next: (res) => {
        this.publishers = res.data || [];
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
    this.loadPublishers();
  }

  onSearch(term: string): void {
    this.filters = { ...this.filters, search: term, page: 1 };
    this.loadPublishers();
  }

  openAddModal(): void {
    this.editItem = null;
    this.formData = { name: '', contact_person: '', email: '', phone: '' };
    this.showModal = true;
  }

  openEditModal(item: LibraryPublisher): void {
    this.editItem = item;
    this.formData = {
      name: item.name,
      contact_person: item.contact_person || '',
      email: item.email || '',
      phone: item.phone || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  savePublisher(): void {
    const branchId = this.auth.currentUser()?.branch_id || 1;
    if (this.editItem) {
      this.libraryService.updatePublisher(this.editItem.id, this.formData).subscribe({
        next: () => { this.closeModal(); this.loadPublishers(); },
        error: (e) => this.errorHandler.showError(e)
      });
    } else {
      this.libraryService.createPublisher({ ...this.formData, branch_id: branchId }).subscribe({
        next: () => { this.closeModal(); this.loadPublishers(); },
        error: (e) => this.errorHandler.showError(e)
      });
    }
  }

  deletePublisher(publisher: LibraryPublisher): void {
    if (!confirm(`Delete publisher "${publisher.name}"?`)) { return; }
    this.libraryService.deletePublisher(publisher.id).subscribe({
      next: () => this.loadPublishers(),
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
