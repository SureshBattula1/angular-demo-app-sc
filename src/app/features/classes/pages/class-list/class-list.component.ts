import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { ClassCrudService } from '../../services/class-crud.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Class } from '../../../../core/models/class.model';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="classes"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Class & Section '"
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
export class ClassListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  classes: Class[] = [];
  selectedClasses: Class[] = [];
  currentFilters: Record<string, unknown> = {};
  
  // Table Configuration  
  tableConfig: TableConfig = {
    columns: [
      { 
        key: 'class_name', 
        header: 'Class', 
        sortable: true, 
        searchable: true,
        width: '150px'
      },
      { 
        key: 'grade', 
        header: 'Grade', 
        sortable: true,
        width: '100px'
      },
      { 
        key: 'section', 
        header: 'Section', 
        sortable: true,
        width: '100px'
      },
      { 
        key: 'academic_year', 
        header: 'Academic Year',
        sortable: true,
        width: '150px'
      },
      { 
        key: 'current_strength', 
        header: 'Students',
        type: 'number',
        align: 'center',
        width: '100px'
      },
      { 
        key: 'capacity', 
        header: 'Capacity',
        type: 'number',
        align: 'center',
        width: '100px'
      },
      { 
        key: 'room_number', 
        header: 'Room',
        sortable: true,
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
        action: (row) => this.viewClass(row)
      },
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row) => this.editClass(row)
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row) => this.deleteClass(row)
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
    title: 'Advanced Class Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'grade',
        label: 'Grade',
        type: 'select',
        icon: 'school',
        options: [
          { value: '1', label: 'Grade 1' },
          { value: '2', label: 'Grade 2' },
          { value: '3', label: 'Grade 3' },
          { value: '4', label: 'Grade 4' },
          { value: '5', label: 'Grade 5' },
          { value: '6', label: 'Grade 6' },
          { value: '7', label: 'Grade 7' },
          { value: '8', label: 'Grade 8' },
          { value: '9', label: 'Grade 9' },
          { value: '10', label: 'Grade 10' },
          { value: '11', label: 'Grade 11' },
          { value: '12', label: 'Grade 12' }
        ],
        group: 'Class Information'
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        icon: 'class',
        options: [
          { value: 'A', label: 'Section A' },
          { value: 'B', label: 'Section B' },
          { value: 'C', label: 'Section C' },
          { value: 'D', label: 'Section D' },
          { value: 'E', label: 'Section E' }
        ],
        group: 'Class Information'
      },
      {
        key: 'academic_year',
        label: 'Academic Year',
        type: 'text',
        placeholder: 'e.g., 2024-2025',
        icon: 'event',
        group: 'Class Information'
      }
    ]
  };
  
  constructor(
    private classCrudService: ClassCrudService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadClasses();
  }
  
  loadClasses(): void {
    this.loading = true;
    
    this.classCrudService.getClasses(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.classes = response.data;
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
    this.loadClasses();
  }
  
  onAction(event: { action: string, row: Class | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/classes/create']);
    }
  }
  
  onRowClick(row: Class): void {
    this.viewClass(row);
  }
  
  onSelectionChange(selected: Class[]): void {
    this.selectedClasses = selected;
  }
  
  viewClass(classItem: Class): void {
    this.router.navigate(['/classes/view', classItem.id]);
  }
  
  editClass(classItem: Class): void {
    this.router.navigate(['/classes/edit', classItem.id]);
  }
  
  deleteClass(classItem: Class): void {
    if (confirm(`Are you sure you want to delete class "${classItem.class_name}"?`)) {
      this.classCrudService.deleteClass(classItem.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Class deleted successfully');
            this.loadClasses();
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

