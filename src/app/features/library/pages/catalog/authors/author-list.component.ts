import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../../services/library.service';
import { LibraryAuthor } from '../../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './author-list.component.html',
  styleUrls: ['./author-list.component.scss']
})
export class AuthorListComponent implements OnInit {
  loading = false;
  authors: LibraryAuthor[] = [];
  showModal = false;
  editItem: LibraryAuthor | null = null;
  formData: { name: string; nationality: string; biography: string } = { name: '', nationality: '', biography: '' };
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'name', header: 'Author Name', sortable: true },
      { key: 'nationality', header: 'Nationality', width: '160px' },
      { key: 'books_count', header: 'Books Count', width: '130px', align: 'center' },
      { key: 'biography', header: 'Biography' }
    ],
    actions: [
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.openEditModal(row), permission: 'library.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteAuthor(row), permission: 'library.delete' }
    ],
    pagination: true,
    searchable: true,
    serverSide: true,
    totalCount: 0,
    addButtonPermission: 'library.create',
    primaryButtonLabel: 'ADD AUTHOR'
  };

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadAuthors();
  }

  loadAuthors(): void {
    this.loading = true;
    this.libraryService.getAuthors(this.filters).subscribe({
      next: (res) => {
        this.authors = res.data || [];
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
    this.loadAuthors();
  }

  onSearch(term: string): void {
    this.filters = { ...this.filters, search: term, page: 1 };
    this.loadAuthors();
  }

  openAddModal(): void {
    this.editItem = null;
    this.formData = { name: '', nationality: '', biography: '' };
    this.showModal = true;
  }

  openEditModal(item: LibraryAuthor): void {
    this.editItem = item;
    this.formData = { name: item.name, nationality: item.nationality || '', biography: item.biography || '' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveAuthor(): void {
    const branchId = this.auth.currentUser()?.branch_id || 1;
    if (this.editItem) {
      this.libraryService.updateAuthor(this.editItem.id, this.formData).subscribe({
        next: () => { this.closeModal(); this.loadAuthors(); },
        error: (e) => this.errorHandler.showError(e)
      });
    } else {
      this.libraryService.createAuthor({ ...this.formData, branch_id: branchId }).subscribe({
        next: () => { this.closeModal(); this.loadAuthors(); },
        error: (e) => this.errorHandler.showError(e)
      });
    }
  }

  deleteAuthor(author: LibraryAuthor): void {
    if (!confirm(`Delete author "${author.name}"?`)) { return; }
    this.libraryService.deleteAuthor(author.id).subscribe({
      next: () => this.loadAuthors(),
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
