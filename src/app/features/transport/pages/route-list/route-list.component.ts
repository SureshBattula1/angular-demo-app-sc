import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { TransportService } from '../../services/transport.service';
import { TransportRoute } from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table [data]="rows" [config]="tableConfig" [title]="'Routes'" [loading]="loading"
      (actionClicked)="onAction($event)" (paginationChanged)="onPage($event)" (sortChanged)="onSort($event)"
      (searchChanged)="onSearch($event)" (searchResetEvent)="onReset()">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class RouteListComponent implements OnInit {
  loading = false;
  rows: TransportRoute[] = [];
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'route_number', header: 'Route No.', sortable: true, searchable: true, width: '140px' },
      { key: 'route_name', header: 'Route Name', sortable: true },
      { key: 'stops_count', header: 'Stops', width: '90px', align: 'center' },
      { key: 'distance', header: 'Distance (km)', width: '130px', align: 'center' },
      { key: 'fare', header: 'Fare (₹)', sortable: true, width: '110px', align: 'right' },
      { key: 'branch.name', header: 'Branch', width: '170px' }
    ],
    actions: [
      { icon: 'visibility', label: 'View', action: (r) => this.router.navigate(['/transport/routes/view', r.id]), permission: 'transport.view' },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (r) => this.router.navigate(['/transport/routes/edit', r.id]), permission: 'transport.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (r) => this.remove(r), permission: 'transport.delete' }
    ],
    selectable: false, pagination: true, searchable: true, responsive: true,
    serverSide: true, totalCount: 0, pageSizeOptions: [10, 25, 50, 100], defaultPageSize: 25,
    addButtonPermission: 'transport.create', primaryButtonLabel: 'ADD ROUTE'
  };

  constructor(private transport: TransportService, private router: Router, private errorHandler: ErrorHandlerService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.transport.getRoutes({ ...this.filters }).subscribe({
      next: (res) => { this.rows = res.data || []; if (res.meta) { this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total }; } this.loading = false; },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  onPage(e: PaginationEvent): void { this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize }; this.load(); }
  onSort(e: SortEvent): void {
    const map: Record<string, string> = { 'route_number': 'transport_routes.route_number', 'route_name': 'transport_routes.route_name', 'fare': 'transport_routes.fare', 'branch.name': 'branches.name' };
    this.filters = { ...this.filters, sort_by: map[e.field] || e.field, sort_direction: e.direction }; this.load();
  }
  onSearch(query: string): void { this.filters = { ...this.filters, search: query, page: 1 }; this.load(); }
  onReset(): void { this.filters = {}; this.load(); }
  onAction(e: { action: string; row: TransportRoute | null }): void { if (e.action === 'add') { this.router.navigate(['/transport/routes/create']); } }

  private remove(r: TransportRoute): void {
    if (!confirm(`Delete route "${r.route_name}"? Its stops and student assignments will be removed.`)) { return; }
    this.transport.deleteRoute(r.id).subscribe({
      next: (res) => { if (res.success) { this.errorHandler.showSuccess('Route deleted'); this.load(); } else { this.errorHandler.showError(res.message || 'Failed'); } },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
