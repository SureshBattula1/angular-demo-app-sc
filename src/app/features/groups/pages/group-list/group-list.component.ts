import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { GroupService } from '../../services/group.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentGroup } from '../../../../core/models/class-section.model';

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
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class GroupListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  groups: StudentGroup[] = [];
  selectedGroups: StudentGroup[] = [];
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
        header: 'Group Name', 
        sortable: true, 
        searchable: true
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
    serverSide: false,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 10
  };
  
  // Advanced Search Configuration
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Group Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'code',
        label: 'Group Code',
        type: 'text',
        placeholder: 'Enter group code',
        icon: 'qr_code',
        group: 'Basic Information'
      },
      {
        key: 'name',
        label: 'Group Name',
        type: 'text',
        placeholder: 'Enter group name',
        icon: 'groups',
        group: 'Basic Information'
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
        group: 'Type'
      },
      {
        key: 'academic_year',
        label: 'Academic Year',
        type: 'text',
        placeholder: 'e.g., 2024-2025',
        icon: 'event',
        group: 'Academic'
      },
      {
        key: 'is_active',
        label: 'Active Only',
        type: 'checkbox',
        icon: 'check_circle',
        group: 'Status'
      }
    ]
  };
  
  constructor(
    private groupService: GroupService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadGroups();
  }
  
  loadGroups(): void {
    this.loading = true;
    
    this.groupService.getGroups(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.groups = response.data;
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
  
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...event.filters,
      search: event.query
    };
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

