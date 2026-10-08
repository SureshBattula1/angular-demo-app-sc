import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../../services/library.service';
import { LibraryCategory } from '../../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  loading = false;
  categories: LibraryCategory[] = [];
  showModal = false;
  editItem: LibraryCategory | null = null;
  formData: { name: string; code: string; description: string } = { name: '', code: '', description: '' };
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'name', header: 'Category Name', sortable: true },
      { key: 'code', header: 'Code', width: '110px', align: 'center' },
      { key: 'books_count', header: 'Books Count', width: '130px', align: 'center' },
      { key: 'description', header: 'Description' }
    ],
    actions: [
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.openEditModal(row), permission: 'library.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteCategory(row), permission: 'library.delete' }
    ],
    pagination: true,
    searchable: true,
    serverSide: true,
    totalCount: 0,
    addButtonPermission: 'library.create',
    primaryButtonLabel: 'ADD CATEGORY'
  };

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.libraryService.getCategories(this.filters).subscribe({
      next: (res) => {
        this.categories = res.data || [];
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
    this.loadCategories();
  }

  onSearch(term: string): void {
    this.filters = { ...this.filters, search: term, page: 1 };
    this.loadCategories();
  }

  openAddModal(): void {
    this.editItem = null;
    this.formData = { name: '', code: '', description: '' };
    this.showModal = true;
  }

  openEditModal(item: LibraryCategory): void {
    this.editItem = item;
    this.formData = { name: item.name, code: item.code || '', description: item.description || '' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCategory(): void {
    const branchId = this.auth.currentUser()?.branch_id || 1;
    if (this.editItem) {
      this.libraryService.updateCategory(this.editItem.id, this.formData).subscribe({
        next: () => { this.closeModal(); this.loadCategories(); },
        error: (e) => this.errorHandler.showError(e)
      });
    } else {
      this.libraryService.createCategory({ ...this.formData, branch_id: branchId }).subscribe({
        next: () => { this.closeModal(); this.loadCategories(); },
        error: (e) => this.errorHandler.showError(e)
      });
    }
  }

  deleteCategory(cat: LibraryCategory): void {
    if (!confirm(`Delete category "${cat.name}"?`)) { return; }
    this.libraryService.deleteCategory(cat.id).subscribe({
      next: () => this.loadCategories(),
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
