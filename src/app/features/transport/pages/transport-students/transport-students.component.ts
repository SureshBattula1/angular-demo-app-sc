import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { TransportService } from '../../services/transport.service';
import { StudentTransport } from '../../../../core/models/transport.model';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-transport-students',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DataTableComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './transport-students.component.html',
  styleUrls: ['./transport-students.component.scss']
})
export class TransportStudentsComponent implements OnInit {
  loading = false;
  rows: StudentTransport[] = [];
  private filters: Record<string, unknown> = {};

  tableConfig: TableConfig = {
    columns: [
      { key: 'student_name', header: 'Student Name', sortable: true, searchable: true, width: '180px' },
      { key: 'admission_no', header: 'Adm No.', sortable: true, width: '120px' },
      { key: 'class_name', header: 'Class / Sec', width: '120px' },
      { key: 'route_name', header: 'Assigned Route', sortable: true, width: '180px' },
      { key: 'pickup_stop_name', header: 'Pickup Stop', width: '160px' },
      { key: 'drop_stop_name', header: 'Drop Stop', width: '160px' },
      { key: 'pickup_time', header: 'Pickup Time', width: '110px' },
      { key: 'drop_time', header: 'Drop Time', width: '110px' },
      { key: 'vehicle_number', header: 'Vehicle', width: '120px' },
      { key: 'monthly_fee', header: 'Monthly Fare', type: 'number', width: '110px', align: 'right' },
      { key: 'status', header: 'Status', type: 'badge', width: '100px', align: 'center' }
    ],
    actions: [
      {
        icon: 'swap_horiz',
        label: 'Manage Assignment',
        color: 'primary',
        action: () => this.router.navigate(['/transport/assignments']),
        permission: 'transport.edit'
      }
    ],
    selectable: false,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    primaryButtonLabel: 'BULK ASSIGNMENT',
    addButtonPermission: 'transport.edit'
  };

  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Filter Transport Students',
    width: '420px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      { key: 'branch_id', label: 'Branch', type: 'select', icon: 'business', options: [] },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'info',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' }
        ]
      }
    ]
  };

  constructor(
    private transport: TransportService,
    private branchService: BranchService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.load();
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (res) => {
        const field = this.advancedSearchConfig.fields.find((x) => x.key === 'branch_id');
        if (field) {
          field.options = (res.success && res.data)
            ? res.data.map((b) => ({ value: b.id.toString(), label: b.name }))
            : [];
        }
      },
      error: () => {}
    });
  }

  load(): void {
    this.loading = true;
    this.transport.getAssignments({ ...this.filters }).subscribe({
      next: (res) => {
        this.rows = res.data || [];
        if (res.meta) {
          this.tableConfig = { ...this.tableConfig, totalCount: res.meta.total };
        }
        this.loading = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loading = false;
      }
    });
  }

  onPage(e: PaginationEvent): void {
    this.filters = { ...this.filters, page: e.page + 1, per_page: e.pageSize };
    this.load();
  }

  onSort(e: SortEvent): void {
    this.filters = { ...this.filters, sort_by: e.field, sort_direction: e.direction };
    this.load();
  }

  onBasicSearch(query: string): void {
    this.filters = { ...this.filters, search: query, page: 1 };
    this.load();
  }

  onAdvSearch(e: SearchEvent): void {
    this.filters = { ...e.filters, search: e.query, page: 1 };
    this.load();
  }

  onReset(): void {
    this.filters = {};
    this.load();
  }

  onAction(e: { action: string; row: StudentTransport | null }): void {
    if (e.action === 'add') {
      this.router.navigate(['/transport/assignments']);
    }
  }
}
