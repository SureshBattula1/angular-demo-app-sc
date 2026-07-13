import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { CompanyService } from '../../../services/company.service';
import { Company } from '../../../../core/models/school.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="companies"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Companies'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CompanyListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;

  loading = false;
  companies: Company[] = [];
  selectedCompanies: Company[] = [];

  // Current request state
  currentFilters: Record<string, unknown> = {};

  // Table Configuration - same design/colors as school list
  tableConfig: TableConfig = {
    columns: [
      {
        key: 'code',
        header: 'Code',
        sortable: true,
        searchable: true,
        width: '120px'
      },
      {
        key: 'name',
        header: 'Company Name',
        sortable: true,
        searchable: true
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        type: 'badge',
        width: '140px',
        align: 'center'
      },
      {
        key: 'schools_count',
        header: 'Schools',
        type: 'number',
        align: 'center',
        width: '120px'
      },
      {
        key: 'active_schools_count',
        header: 'Active Schools',
        type: 'number',
        align: 'center',
        width: '120px'
      }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View Details',
        action: (row) => this.viewCompany(row),
      },
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row) => this.editCompany(row),
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row) => this.deleteCompany(row),
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: false,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    showAddButton: true
  };

  // Advanced Search Configuration - same structure as schools
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Company Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'name',
        label: 'Company Name',
        type: 'text',
        placeholder: 'Enter company name',
        icon: 'business',
        group: 'Basic Information'
      },
      {
        key: 'code',
        label: 'Company Code',
        type: 'text',
        placeholder: 'Enter company code',
        icon: 'qr_code',
        group: 'Basic Information'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'toggle_on',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' },
          { value: 'Suspended', label: 'Suspended' }
        ],
        group: 'Basic Information'
      }
    ]
  };

  constructor(
    private companyService: CompanyService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  /**
   * Load companies from server with pagination and sorting
   */
  loadCompanies(): void {
    this.loading = true;

    this.companyService.getCompanies(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.companies = response.data || [];
          if (response.meta) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.meta.total };
          } else {
            this.tableConfig.totalCount = response.data?.length || 0;
          }
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
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
    this.loadCompanies();
  }

  onSortChange(event: SortEvent): void {
    const columnMapping: Record<string, string> = {
      'status': 'status',
      'schools_count': 'schools_count',
      'active_schools_count': 'active_schools_count'
    };
    const sortColumn = columnMapping[event.field] || event.field;
    // Backend CompanyController uses sort_order
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_order: event.direction
    };
    this.loadCompanies();
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadCompanies();
  }

  onAction(event: { action: string; row: Company | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/company-portal/companies/create']);
    }
  }

  onRowClick(row: Company): void {
    this.viewCompany(row);
  }

  onSelectionChange(selected: Company[]): void {
    this.selectedCompanies = selected;
  }

  viewCompany(company: Company): void {
    this.router.navigate(['/company-portal/companies', company.id]);
  }

  editCompany(company: Company): void {
    this.router.navigate(['/company-portal/companies', company.id, 'edit']);
  }

  deleteCompany(company: Company): void {
    if (confirm(`Are you sure you want to delete company "${company.name}"? This action cannot be undone.`)) {
      this.companyService.deleteCompany(company.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Company deleted successfully');
            this.loadCompanies();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
}
