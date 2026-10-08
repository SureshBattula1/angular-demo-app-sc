import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { LibraryService } from '../../../services/library.service';
import { LibrarySubject } from '../../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DataTableComponent],
  templateUrl: './subject-list.component.html',
  styleUrls: ['./subject-list.component.scss']
})
export class SubjectListComponent implements OnInit {
  loading = false;
  subjects: LibrarySubject[] = [];
  showModal = false;
  editItem: LibrarySubject | null = null;
  formData: { name: string; code: string; description: string } = { name: '', code: '', description: '' };
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'name', header: 'Subject Name', sortable: true },
      { key: 'code', header: 'Code', width: '130px', align: 'center' },
      { key: 'books_count', header: 'Books Count', width: '130px', align: 'center' },
      { key: 'description', header: 'Description' }
    ],
    actions: [
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.openEditModal(row), permission: 'library.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteSubject(row), permission: 'library.delete' }
    ],
    pagination: true,
    searchable: true,
    serverSide: true,
    totalCount: 0,
    addButtonPermission: 'library.create',
    primaryButtonLabel: 'ADD SUBJECT'
  };

  constructor(
    private libraryService: LibraryService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.loading = true;
    this.libraryService.getSubjects(this.filters).subscribe({
      next: (res) => {
        this.subjects = res.data || [];
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
    this.loadSubjects();
  }

  onSearch(term: string): void {
    this.filters = { ...this.filters, search: term, page: 1 };
    this.loadSubjects();
  }

  openAddModal(): void {
    this.editItem = null;
    this.formData = { name: '', code: '', description: '' };
    this.showModal = true;
  }

  openEditModal(item: LibrarySubject): void {
    this.editItem = item;
    this.formData = { name: item.name, code: item.code || '', description: item.description || '' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveSubject(): void {
    const branchId = this.auth.currentUser()?.branch_id || 1;
    if (this.editItem) {
      this.libraryService.updateSubject(this.editItem.id, this.formData).subscribe({
        next: () => { this.closeModal(); this.loadSubjects(); },
        error: (e) => this.errorHandler.showError(e)
      });
    } else {
      this.libraryService.createSubject({ ...this.formData, branch_id: branchId }).subscribe({
        next: () => { this.closeModal(); this.loadSubjects(); },
        error: (e) => this.errorHandler.showError(e)
      });
    }
  }

  deleteSubject(subject: LibrarySubject): void {
    if (!confirm(`Delete subject "${subject.name}"?`)) { return; }
    this.libraryService.deleteSubject(subject.id).subscribe({
      next: () => this.loadSubjects(),
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
