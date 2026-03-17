import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../../shared/components/data-table/data-table.interface';
import { AcademicYearService, AcademicYear } from '../../../services/academic-year.service';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-academic-year-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  template: `
    <app-data-table
      #dataTable
      [data]="academicYears"
      [config]="tableConfig"
      [title]="'Academic Year'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (searchChanged)="onSearchChange($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class AcademicYearListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;

  loading = false;
  academicYears: AcademicYear[] = [];
  currentFilters: Record<string, unknown> = {
    page: 1,
    per_page: 10,
    include_past: 1
  };

  tableConfig: TableConfig = {
    columns: [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'start_date', header: 'Start Date', sortable: true, type: 'date' },
      { key: 'end_date', header: 'End Date', sortable: true, type: 'date' },
      {
        key: 'is_current',
        header: 'Current',
        sortable: true,
        type: 'badge',
        pipe: 'yesNo',
        cellClass: (row: AcademicYear) => row.is_current ? 'text-success' : ''
      },
      {
        key: 'is_active',
        header: 'Status',
        sortable: true,
        type: 'badge',
        pipe: 'activeInactive',
        cellClass: (row: AcademicYear) => row.is_active ? 'text-success' : 'text-danger'
      }
    ],
    actions: [
      { label: 'View', icon: 'visibility', action: (row: AcademicYear) => this.view(row.id), color: 'primary' },
      { label: 'Edit', icon: 'edit', action: (row: AcademicYear) => this.edit(row.id), color: 'info' },
      { label: 'Delete', icon: 'delete', action: (row: AcademicYear) => this.delete(row), color: 'warn' }
    ],
    serverSide: true,
    pagination: true,
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    totalCount: 0,
    searchable: true,
    selectable: false,
    responsive: true,
    showAddButton: true
  };

  constructor(
    private academicYearService: AcademicYearService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading = true;
    this.academicYearService.getList(this.currentFilters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.academicYears = response.data || [];
          this.tableConfig = {
            ...this.tableConfig,
            totalCount: response.meta?.total ?? this.academicYears.length
          };
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.loading = false;
      }
    });
  }

  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };
    this.loadList();
  }

  onSortChange(event: SortEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: event.field,
      sort_direction: event.direction,
      page: 1
    };
    this.loadList();
  }

  onSearchChange(query: string): void {
    this.currentFilters = {
      ...this.currentFilters,
      search: query || undefined,
      page: 1
    };
    this.loadList();
  }

  onAction(event: { action: string; row?: any }): void {
    if (event.action === 'add') {
      this.create();
    }
  }

  onRowClick(row: AcademicYear): void {
    this.view(row.id);
  }

  view(id: number): void {
    this.router.navigate(['/settings/academic-years/view', id]);
  }

  edit(id: number): void {
    this.router.navigate(['/settings/academic-years/edit', id]);
  }

  delete(row: AcademicYear): void {
    if (!confirm(`Delete academic year "${row.name}"?`)) return;
    this.academicYearService.delete(row.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Academic year deleted successfully');
          this.loadList();
        }
      },
      error: (error) => this.errorHandler.handleError(error)
    });
  }

  create(): void {
    this.router.navigate(['/settings/academic-years/create']);
  }
}
