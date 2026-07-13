import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { TransportService } from '../../services/transport.service';
import { TransportDriver } from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table [data]="rows" [config]="tableConfig" [title]="'Drivers'" [loading]="loading"
      (actionClicked)="onAction($event)" (paginationChanged)="onPage($event)" (sortChanged)="onSort($event)"
      (searchChanged)="onSearch($event)" (searchResetEvent)="onReset()">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class DriverListComponent implements OnInit {
  loading = false;
  rows: TransportDriver[] = [];
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'name', header: 'Name', sortable: true, searchable: true },
      { key: 'phone', header: 'Phone', width: '150px' },
      { key: 'license_number', header: 'License No.', width: '150px' },
      { key: 'license_expiry', header: 'License Expiry', type: 'date', width: '150px' },
      { key: 'branch.name', header: 'Branch', width: '170px' }
    ],
    actions: [
      { icon: 'edit', label: 'Edit', color: 'primary', action: (r) => this.router.navigate(['/transport/drivers/edit', r.id]), permission: 'transport.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (r) => this.remove(r), permission: 'transport.delete' }
    ],
    selectable: false, pagination: true, searchable: true, responsive: true,
    serverSide: true, totalCount: 0, pageSizeOptions: [10, 25, 50, 100], defaultPageSize: 25,
    addButtonPermission: 'transport.create', primaryButtonLabel: 'ADD DRIVER'
  };

  constructor(private transport: TransportService, private router: Router, private errorHandler: ErrorHandlerService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.transport.getDrivers({ ...this.filters }).subscribe({
      next: (res) => { this.rows = res.data || []; if (res.meta) { this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total }; } this.loading = false; },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  onPage(e: PaginationEvent): void { this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize }; this.load(); }
  onSort(e: SortEvent): void {
    const map: Record<string, string> = { 'name': 'transport_drivers.name', 'license_expiry': 'transport_drivers.license_expiry', 'branch.name': 'branches.name' };
    this.filters = { ...this.filters, sort_by: map[e.field] || e.field, sort_direction: e.direction }; this.load();
  }
  onSearch(query: string): void { this.filters = { ...this.filters, search: query, page: 1 }; this.load(); }
  onReset(): void { this.filters = {}; this.load(); }
  onAction(e: { action: string; row: TransportDriver | null }): void { if (e.action === 'add') { this.router.navigate(['/transport/drivers/create']); } }

  private remove(d: TransportDriver): void {
    if (!confirm(`Delete driver "${d.name}"?`)) { return; }
    this.transport.deleteDriver(d.id).subscribe({
      next: (res) => { if (res.success) { this.errorHandler.showSuccess('Driver deleted'); this.load(); } else { this.errorHandler.showError(res.message || 'Failed'); } },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
