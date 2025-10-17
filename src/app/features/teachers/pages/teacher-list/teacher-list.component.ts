import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { TeacherService } from '../../services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Teacher } from '../../../../core/models/teacher.model';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="teachers"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Teacher Management'"
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
export class TeacherListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  teachers: Teacher[] = [];
  selectedTeachers: Teacher[] = [];
  currentFilters: Record<string, unknown> = {};
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'first_name', header: 'First Name', sortable: true, searchable: true },
      { key: 'last_name', header: 'Last Name', sortable: true, searchable: true },
      { key: 'email', header: 'Email', searchable: true },
      { key: 'phone', header: 'Phone', width: '130px' },
      { key: 'role', header: 'Role', type: 'badge', width: '100px', align: 'center' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewTeacher(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editTeacher(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteTeacher(row) }
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
    title: 'Advanced Teacher Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'email',
        label: 'Email',
        type: 'text',
        placeholder: 'Enter email',
        icon: 'email',
        group: 'Basic'
      },
      {
        key: 'phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        icon: 'phone',
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
    private teacherService: TeacherService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadTeachers();
  }
  
  loadTeachers(): void {
    this.loading = true;
    
    this.teacherService.getTeachers(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teachers = response.data;
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
    this.loadTeachers();
  }
  
  onAction(event: { action: string, row: Teacher | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/teachers/create']);
    }
  }
  
  onRowClick(row: Teacher): void {
    this.viewTeacher(row);
  }
  
  onSelectionChange(selected: Teacher[]): void {
    this.selectedTeachers = selected;
  }
  
  viewTeacher(teacher: Teacher): void {
    this.router.navigate(['/teachers/view', teacher.id]);
  }
  
  editTeacher(teacher: Teacher): void {
    this.router.navigate(['/teachers/edit', teacher.id]);
  }
  
  deleteTeacher(teacher: Teacher): void {
    if (confirm(`Are you sure you want to deactivate teacher "${teacher.first_name} ${teacher.last_name}"?`)) {
      this.teacherService.deleteTeacher(teacher.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Teacher deactivated successfully');
            this.loadTeachers();
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

