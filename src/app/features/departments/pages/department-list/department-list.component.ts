import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { DepartmentService } from '../../services/department.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Department } from '../../../../core/models/department.model';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="departments"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Department Management'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class DepartmentListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  departments: Department[] = [];
  selectedDepartments: Department[] = [];
  currentFilters: Record<string, unknown> = {};
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'name', header: 'Department Name', sortable: true, searchable: true },
      { key: 'head', header: 'Head', sortable: true, searchable: true },
      { key: 'established_date', header: 'Established', sortable: true, type: 'date', width: '130px' },
      { key: 'students_count', header: 'Students', type: 'number', align: 'center', width: '100px' },
      { key: 'teachers_count', header: 'Teachers', type: 'number', align: 'center', width: '100px' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewDepartment(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editDepartment(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteDepartment(row) }
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
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Department Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'name',
        label: 'Department Name',
        type: 'text',
        placeholder: 'Enter department name',
        icon: 'business',
        group: 'Basic'
      },
      {
        key: 'head',
        label: 'Department Head',
        type: 'text',
        placeholder: 'Enter head name',
        icon: 'person',
        group: 'Basic'
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
    private departmentService: DepartmentService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadDepartments();
  }
  
  loadDepartments(): void {
    this.loading = true;
    
    this.departmentService.getDepartments(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.departments = response.data;
          this.tableConfig.totalCount = response.data.length;
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
    this.loadDepartments();
  }
  
  onAction(event: { action: string, row: Department | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/departments/create']);
    }
  }
  
  onRowClick(row: Department): void {
    this.viewDepartment(row);
  }
  
  onSelectionChange(selected: Department[]): void {
    this.selectedDepartments = selected;
  }
  
  viewDepartment(department: Department): void {
    this.router.navigate(['/departments/view', department.id]);
  }
  
  editDepartment(department: Department): void {
    this.router.navigate(['/departments/edit', department.id]);
  }
  
  deleteDepartment(department: Department): void {
    if (confirm(`Are you sure you want to delete department "${department.name}"?`)) {
      this.departmentService.deleteDepartment(department.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Department deleted successfully');
            this.loadDepartments();
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

