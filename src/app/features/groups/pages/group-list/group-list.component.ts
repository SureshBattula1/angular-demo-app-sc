import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { GroupService } from '../../services/group.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentGroup } from '../../../../core/models/class-section.model';
import { BranchService, Branch } from '../../../../core/services/branch.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="groups"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Student Groups'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)"
      (searchResetEvent)="onSearchReset()">
    </app-data-table>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class GroupListComponent implements OnInit, OnDestroy {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  private academicYearSub?: Subscription;
  groups: StudentGroup[] = [];
  selectedGroups: StudentGroup[] = [];
  currentFilters: Record<string, unknown> = {};
  branches: Branch[] = [];
  
  // Table Configuration
  tableConfig: TableConfig = {
    columns: [
      { 
        key: 'branch.name', 
        header: 'Branch', 
        sortable: false        
      },     
      { 
        key: 'name', 
        header: 'Group Name', 
        sortable: true, 
        searchable: true
      },
      { 
        key: 'code', 
        header: 'Code', 
        sortable: true, 
        searchable: true,
        width: '120px'
      },
      { 
        key: 'type', 
        header: 'Type', 
        sortable: true,
        type: 'badge',
        width: '130px',
        align: 'center'
      },
      { 
        key: 'academic_year', 
        header: 'Academic Year',
        sortable: true,
        width: '150px'
      },
      { 
        key: 'member_count', 
        header: 'Members',
        type: 'number',
        align: 'center',
        width: '100px'
      },
      { 
        key: 'is_active', 
        header: 'Status', 
        type: 'badge',
        pipe: 'activeInactive',
        cellClass: (row: StudentGroup) => row.is_active ? 'badge-success' : 'badge-danger',
        width: '100px',
        align: 'center'
      }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View Details',
        action: (row) => this.viewGroup(row)
      },
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row) => this.editGroup(row)
      },
      {
        icon: 'person_add',
        label: 'Manage Members',
        color: 'accent',
        action: (row) => this.manageMembers(row)
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row) => this.deleteGroup(row)
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25
  };
  
  // Advanced Search Configuration
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Group Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        icon: 'business',
        options: [],
        placeholder: 'Select branch'
        // group: 'Basic Information'
      },
      {
        key: 'code',
        label: 'Group Code',
        type: 'text',
        placeholder: 'Enter group code',
        icon: 'qr_code',
        // group: 'Basic Information'
      },
      {
        key: 'name',
        label: 'Group Name',
        type: 'text',
        placeholder: 'Enter group name',
        icon: 'groups',
        // group: 'Basic Information'
      },
     
      {
        key: 'type',
        label: 'Group Type',
        type: 'select',
        icon: 'category',
        options: [
          { value: 'Academic', label: 'Academic' },
          { value: 'Sports', label: 'Sports' },
          { value: 'Cultural', label: 'Cultural' },
          { value: 'Club', label: 'Club' }
        ],
        // group: 'Type'
      },
      // {
      //   key: 'academic_year',
      //   label: 'Academic Year',
      //   type: 'text',
      //   placeholder: 'e.g., 2024-2025',
      //   icon: 'event',
      //   // group: 'Academic'
      // },
      {
        key: 'is_active',
        label: 'Active Only',
        type: 'checkbox',
        icon: 'check_circle',
        // group: 'Status'
      }
    ]
  };
  
  constructor(
    private groupService: GroupService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private branchService: BranchService,
    private academicYearContext: AcademicYearContextService
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadGroups();
    this.academicYearSub = this.academicYearContext.selectedYearId$.pipe(skip(1)).subscribe(() => {
      this.currentFilters = { ...this.currentFilters, page: 1 };
      this.loadGroups();
    });
  }

  ngOnDestroy(): void {
    this.academicYearSub?.unsubscribe();
  }
  
  loadBranches(): void {
    this.branchService.getAccessibleBranches().subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data || [];
          
          // Update advanced search config with branch options
          const branchField = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = this.branches.map(branch => ({
              value: branch.id,
              label: branch.name
            }));
          }
        }
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }
  
  loadGroups(): void {
    this.loading = true;
    const academicYearId = this.academicYearContext.selectedYearId;
    const params = {
      ...this.currentFilters,
      ...(academicYearId != null ? { academic_year_id: academicYearId } : {})
    };
    
    this.groupService.getGroups(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.groups = response.data || [];
          if (response.meta) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.meta.total };
          } else if (response.count) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.count };
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
  
  /**
   * Handle pagination changes
   */
  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1,
      per_page: event.pageSize
    };
    this.loadGroups();
  }
  
  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    const columnMapping: Record<string, string> = {
      'id': 'id',
      'code': 'code',
      'name': 'name',
      'type': 'type',
      'academic_year': 'academic_year',
      'member_count': 'member_count',
      'is_active': 'is_active'
    };
    
    const sortColumn = columnMapping[event.field] || event.field;
    
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_direction: event.direction
    };
    this.loadGroups();
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      ...event.filters,
      search: event.query || undefined,
      page: 1
    };
    this.loadGroups();
  }

  onSearchReset(): void {
    this.currentFilters = { page: 1, per_page: this.tableConfig.defaultPageSize ?? 25 };
    this.loadGroups();
  }
  
  onAction(event: { action: string, row: StudentGroup | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/groups/create']);
    }
  }
  
  onRowClick(row: StudentGroup): void {
    this.viewGroup(row);
  }
  
  onSelectionChange(selected: StudentGroup[]): void {
    this.selectedGroups = selected;
  }
  
  viewGroup(group: StudentGroup): void {
    this.router.navigate(['/groups/view', group.id]);
  }
  
  editGroup(group: StudentGroup): void {
    this.router.navigate(['/groups/edit', group.id]);
  }
  
  manageMembers(group: StudentGroup): void {
    this.router.navigate(['/groups', group.id, 'members']);
  }
  
  deleteGroup(group: StudentGroup): void {
    if (confirm(`Are you sure you want to delete group "${group.name}"?`)) {
      this.groupService.deleteGroup(group.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Group deleted successfully');
            this.loadGroups();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  onExport(format: string): void {
    this.errorHandler.showInfo(`Export as ${format} - Feature coming soon`);
  }
}

