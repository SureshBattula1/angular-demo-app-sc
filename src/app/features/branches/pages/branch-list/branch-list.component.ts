import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, PaginationEvent, SortEvent, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { BranchService } from '../../services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Branch } from '../../../../core/models/branch.model';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="branches"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Branch'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
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
export class BranchListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  branches: Branch[] = [];
  selectedBranches: Branch[] = [];
  
  // Current request state
  currentFilters: Record<string, unknown> = {};
  
  // Table Configuration
  tableConfig: TableConfig = {
    columns: [
      { 
        key: 'id', 
        header: 'ID', 
        sortable: true, 
        width: '80px'
      },
      { 
        key: 'code', 
        header: 'Code', 
        sortable: true, 
        searchable: true,
        width: '120px'
      },
      { 
        key: 'name', 
        header: 'Branch Name', 
        sortable: true, 
        searchable: true
      },
      { 
        key: 'branch_type', 
        header: 'Type', 
        sortable: true,
        width: '140px',
        cellClass: 'branch-type-cell'
      },
      { 
        key: 'city', 
        header: 'City', 
        sortable: true,
        searchable: true,
        width: '120px'
      },
      { 
        key: 'region', 
        header: 'Region', 
        sortable: true,
        width: '120px'
      },
      { 
        key: 'phone', 
        header: 'Phone', 
        width: '140px'
      },
      { 
        key: 'principal_name', 
        header: 'Principal',
        width: '150px'
      },
      { 
        key: 'current_enrollment', 
        header: 'Enrollment',
        type: 'number',
        align: 'center',
        width: '110px'
      },
      { 
        key: 'total_capacity', 
        header: 'Capacity',
        type: 'number',
        align: 'center',
        width: '100px'
      },
      { 
        key: 'status', 
        header: 'Status', 
        type: 'badge',
        width: '120px',
        align: 'center'
      },
      { 
        key: 'is_active', 
        header: 'Active', 
        type: 'badge',
        width: '90px',
        align: 'center'
      }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View Details',
        action: (row) => this.viewBranch(row)
      },
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row) => this.editBranch(row)
      },
      {
        icon: 'bar_chart',
        label: 'Statistics',
        color: 'accent',
        action: (row) => this.viewStats(row)
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row) => this.deleteBranch(row)
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: false,
    totalCount: 0,
    pageSizeOptions: [5, 10, 25, 50, 100],
    defaultPageSize: 10
  };
  
  // Advanced Search Configuration
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Branch Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'code',
        label: 'Branch Code',
        type: 'text',
        placeholder: 'Enter branch code',
        icon: 'qr_code',
        group: 'Basic Information'
      },
      {
        key: 'name',
        label: 'Branch Name',
        type: 'text',
        placeholder: 'Enter branch name',
        icon: 'business',
        group: 'Basic Information'
      },
      {
        key: 'branch_type',
        label: 'Branch Type',
        type: 'select',
        icon: 'category',
        options: [
          { value: 'HeadOffice', label: 'Head Office' },
          { value: 'RegionalOffice', label: 'Regional Office' },
          { value: 'School', label: 'School' },
          { value: 'Campus', label: 'Campus' },
          { value: 'SubBranch', label: 'Sub Branch' }
        ],
        group: 'Basic Information'
      },
      {
        key: 'city',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        icon: 'location_city',
        group: 'Location'
      },
      {
        key: 'region',
        label: 'Region',
        type: 'text',
        placeholder: 'Enter region',
        icon: 'place',
        group: 'Location'
      },
      {
        key: 'state',
        label: 'State',
        type: 'text',
        placeholder: 'Enter state',
        icon: 'map',
        group: 'Location'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        icon: 'toggle_on',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' },
          { value: 'UnderConstruction', label: 'Under Construction' },
          { value: 'Maintenance', label: 'Maintenance' },
          { value: 'Closed', label: 'Closed' }
        ],
        group: 'Status'
      },
      {
        key: 'is_active',
        label: 'Active Only',
        type: 'checkbox',
        icon: 'check_circle',
        group: 'Status'
      },
      {
        key: 'is_main_branch',
        label: 'Main Branch Only',
        type: 'checkbox',
        icon: 'home',
        group: 'Filters'
      },
      {
        key: 'has_hostel',
        label: 'Has Hostel',
        type: 'checkbox',
        icon: 'hotel',
        group: 'Facilities'
      },
      {
        key: 'has_transport',
        label: 'Has Transport',
        type: 'checkbox',
        icon: 'directions_bus',
        group: 'Facilities'
      },
      {
        key: 'has_library',
        label: 'Has Library',
        type: 'checkbox',
        icon: 'local_library',
        group: 'Facilities'
      },
      {
        key: 'has_lab',
        label: 'Has Lab',
        type: 'checkbox',
        icon: 'biotech',
        group: 'Facilities'
      }
    ]
  };
  
  constructor(
    private branchService: BranchService,
    private router: Router,
    private dialog: MatDialog,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
  }
  
  /**
   * Load branches from server
   */
  loadBranches(): void {
    this.loading = true;
    
    this.branchService.getBranches(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data;
          this.tableConfig.totalCount = response.count;
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }
  
  /**
   * Handle pagination changes
   */
  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };
    this.loadBranches();
  }
  
  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: event.field,
      sort_direction: event.direction
    };
    this.loadBranches();
  }
  
  /**
   * Handle advanced search changes
   */
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...event.filters,
      search: event.query
    };
    this.loadBranches();
  }
  
  onAction(event: { action: string, row: Branch | null }): void {
    console.log('Action triggered:', event);
    
    // Handle add action
    if (event.action === 'add') {
      this.router.navigate(['/branches/create']);
    }
  }
  
  onRowClick(row: Branch): void {
    this.viewBranch(row);
  }
  
  onSelectionChange(selected: Branch[]): void {
    this.selectedBranches = selected;
    console.log('Selected branches:', selected);
  }
  
  /**
   * View branch details
   */
  viewBranch(branch: Branch): void {
    this.router.navigate(['/branches/view', branch.id]);
  }
  
  /**
   * Edit branch
   */
  editBranch(branch: Branch): void {
    this.router.navigate(['/branches/edit', branch.id]);
  }
  
  /**
   * View branch statistics
   */
  viewStats(branch: Branch): void {
    this.branchService.getBranchStats(branch.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.errorHandler.showInfo(
            `Students: ${response.data.total_students}, Teachers: ${response.data.total_teachers}`
          );
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }
  
  /**
   * Delete branch with confirmation
   */
  deleteBranch(branch: Branch): void {
    if (confirm(`Are you sure you want to delete branch "${branch.name}"? This will also deactivate all child branches.`)) {
      this.branchService.deleteBranch(branch.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Branch deleted successfully');
            this.loadBranches();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  /**
   * Bulk delete selected branches
   */
  bulkDeleteSelected(): void {
    if (this.selectedBranches.length === 0) {
      this.errorHandler.showWarning('Please select branches to delete');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${this.selectedBranches.length} branch(es)?`)) {
      const branchIds = this.selectedBranches.map(b => b.id);
      
      this.branchService.bulkDelete(branchIds).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess(response.message || 'Branches deleted successfully');
            this.loadBranches();
            this.selectedBranches = [];
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  /**
   * Export branches
   */
  onExport(format: string): void {
    this.errorHandler.showInfo(`Export as ${format} - Feature coming soon`);
  }
}

