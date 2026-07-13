import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { TransportService } from '../../services/transport.service';
import { Vehicle } from '../../../../core/models/transport.model';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table [data]="rows" [config]="tableConfig" [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Vehicles'" [loading]="loading"
      (actionClicked)="onAction($event)" (paginationChanged)="onPage($event)" (sortChanged)="onSort($event)"
      (searchChanged)="onBasicSearch($event)" (advancedSearchChanged)="onAdvSearch($event)" (searchResetEvent)="onReset()">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class VehicleListComponent implements OnInit {
  loading = false;
  rows: Vehicle[] = [];
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'vehicle_number', header: 'Vehicle No.', sortable: true, searchable: true, width: '140px' },
      { key: 'vehicle_type', header: 'Type', type: 'badge', width: '100px', align: 'center' },
      { key: 'make', header: 'Make' },
      { key: 'model', header: 'Model' },
      { key: 'capacity', header: 'Capacity', width: '100px', align: 'center' },
      { key: 'driver.name', header: 'Driver', width: '160px' },
      { key: 'route.name', header: 'Route', width: '160px' },
      { key: 'branch.name', header: 'Branch', width: '160px' },
      { key: 'status', header: 'Status', type: 'badge', width: '120px', align: 'center' }
    ],
    actions: [
      { icon: 'edit', label: 'Edit', color: 'primary', action: (r) => this.router.navigate(['/transport/vehicles/edit', r.id]), permission: 'transport.edit' },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (r) => this.remove(r), permission: 'transport.delete' }
    ],
    selectable: false, pagination: true, searchable: true, advancedSearch: true, responsive: true,
    serverSide: true, totalCount: 0, pageSizeOptions: [10, 25, 50, 100], defaultPageSize: 25,
    addButtonPermission: 'transport.create', primaryButtonLabel: 'ADD VEHICLE'
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Vehicle Search', width: '440px', showReset: true, showSaveSearch: false,
    fields: [
      { key: 'branch_id', label: 'Branch', type: 'select', icon: 'business', options: [] },
      { key: 'status', label: 'Status', type: 'select', icon: 'info', options: [
        { value: 'Active', label: 'Active' }, { value: 'Maintenance', label: 'Maintenance' }, { value: 'Inactive', label: 'Inactive' }
      ] },
      { key: 'vehicle_type', label: 'Type', type: 'select', icon: 'directions_bus', options: [
        { value: 'Bus', label: 'Bus' }, { value: 'Van', label: 'Van' }, { value: 'Car', label: 'Car' }
      ] }
    ]
  };

  constructor(private transport: TransportService, private branchService: BranchService, private router: Router, private errorHandler: ErrorHandlerService) {}

  ngOnInit(): void { this.loadBranches(); this.load(); }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (res) => {
        const f = this.advancedSearchConfig.fields.find(x => x.key === 'branch_id');
        if (f) { f.options = (res.success && res.data) ? res.data.map(b => ({ value: b.id.toString(), label: b.name })) : []; }
      }, error: () => {}
    });
  }

  load(): void {
    this.loading = true;
    this.transport.getVehicles({ ...this.filters }).subscribe({
      next: (res) => { this.rows = res.data || []; if (res.meta) { this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total }; } this.loading = false; },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  onPage(e: PaginationEvent): void { this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize }; this.load(); }
  onSort(e: SortEvent): void {
    const map: Record<string, string> = { 'vehicle_number': 'vehicles.vehicle_number', 'vehicle_type': 'vehicles.vehicle_type', 'capacity': 'vehicles.capacity', 'status': 'vehicles.status', 'branch.name': 'branches.name' };
    this.filters = { ...this.filters, sort_by: map[e.field] || e.field, sort_direction: e.direction }; this.load();
  }
  onBasicSearch(query: string): void { this.filters = { ...this.filters, search: query, page: 1 }; this.load(); }
  onAdvSearch(e: SearchEvent): void { this.filters = { ...e.filters, search: e.query, page: 1 }; this.load(); }
  onReset(): void { this.filters = {}; this.load(); }
  onAction(e: { action: string; row: Vehicle | null }): void { if (e.action === 'add') { this.router.navigate(['/transport/vehicles/create']); } }

  private remove(v: Vehicle): void {
    if (!confirm(`Delete vehicle "${v.vehicle_number}"?`)) { return; }
    this.transport.deleteVehicle(v.id).subscribe({
      next: (res) => { if (res.success) { this.errorHandler.showSuccess('Vehicle deleted'); this.load(); } else { this.errorHandler.showError(res.message || 'Failed'); } },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
