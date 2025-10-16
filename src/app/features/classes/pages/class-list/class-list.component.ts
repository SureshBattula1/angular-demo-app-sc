import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { ClassService } from '../../services/class.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ClassSection } from '../../../../core/models/class-section.model';

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
      [title]="'Class & Section Management'"
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
  classes: ClassSection[] = [];
  selectedClasses: ClassSection[] = [];
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
        key: 'student_count', 
        header: 'Total Students',
        type: 'number',
        align: 'center',
        width: '150px'
      }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View Students',
        action: (row) => this.viewClassStudents(row)
      },
      {
        icon: 'people',
        label: 'Manage Students',
        color: 'primary',
        action: (row) => this.manageStudents(row)
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
    private classService: ClassService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadClasses();
  }
  
  loadClasses(): void {
    this.loading = true;
    
    this.classService.getClasses(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.classes = response.data;
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
    this.loadClasses();
  }
  
  onAction(event: { action: string, row: ClassSection | null }): void {
    console.log('Action triggered:', event);
    
    // Handle add action
    if (event.action === 'add') {
      this.errorHandler.showInfo('Classes are automatically created when students are assigned to grade and section. Please add/edit students to create new classes.');
    }
  }
  
  onRowClick(row: ClassSection): void {
    this.viewClassStudents(row);
  }
  
  onSelectionChange(selected: ClassSection[]): void {
    this.selectedClasses = selected;
  }
  
  viewClassStudents(classSection: ClassSection): void {
    this.router.navigate(['/classes', classSection.grade, classSection.section || 'all', 'students']);
  }
  
  manageStudents(classSection: ClassSection): void {
    this.router.navigate(['/classes', classSection.grade, classSection.section || 'all', 'manage']);
  }
  
  onExport(format: string): void {
    this.errorHandler.showInfo(`Export as ${format} - Feature coming soon`);
  }
}

