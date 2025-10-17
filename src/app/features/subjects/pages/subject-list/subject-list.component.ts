import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { SubjectService } from '../../services/subject.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Subject } from '../../../../core/models/subject.model';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="subjects"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Subject Management'"
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
export class SubjectListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  subjects: Subject[] = [];
  selectedSubjects: Subject[] = [];
  currentFilters: Record<string, unknown> = {};
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'code', header: 'Code', sortable: true, searchable: true, width: '120px' },
      { key: 'name', header: 'Subject Name', sortable: true, searchable: true },
      { key: 'type', header: 'Type', sortable: true, type: 'badge', width: '110px', align: 'center' },
      { key: 'grade_level', header: 'Grade', sortable: true, width: '100px', align: 'center' },
      { key: 'credits', header: 'Credits', type: 'number', align: 'center', width: '100px' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewSubject(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editSubject(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteSubject(row) }
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
    title: 'Advanced Subject Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'code',
        label: 'Subject Code',
        type: 'text',
        placeholder: 'Enter subject code',
        icon: 'qr_code',
        group: 'Basic'
      },
      {
        key: 'type',
        label: 'Subject Type',
        type: 'select',
        icon: 'category',
        options: [
          { value: 'Core', label: 'Core' },
          { value: 'Elective', label: 'Elective' },
          { value: 'Language', label: 'Language' },
          { value: 'Lab', label: 'Lab' },
          { value: 'Activity', label: 'Activity' }
        ],
        group: 'Type'
      },
      {
        key: 'grade_level',
        label: 'Grade Level',
        type: 'select',
        icon: 'school',
        options: Array.from({length: 12}, (_, i) => ({
          value: `${i + 1}`,
          label: `Grade ${i + 1}`
        })),
        group: 'Grade'
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
    private subjectService: SubjectService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadSubjects();
  }
  
  loadSubjects(): void {
    this.loading = true;
    
    this.subjectService.getSubjects(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subjects = response.data;
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
    this.loadSubjects();
  }
  
  onAction(event: { action: string, row: Subject | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/subjects/create']);
    }
  }
  
  onRowClick(row: Subject): void {
    this.viewSubject(row);
  }
  
  onSelectionChange(selected: Subject[]): void {
    this.selectedSubjects = selected;
  }
  
  viewSubject(subject: Subject): void {
    this.router.navigate(['/subjects/view', subject.id]);
  }
  
  editSubject(subject: Subject): void {
    this.router.navigate(['/subjects/edit', subject.id]);
  }
  
  deleteSubject(subject: Subject): void {
    if (confirm(`Are you sure you want to delete subject "${subject.name}"?`)) {
      this.subjectService.deleteSubject(subject.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Subject deleted successfully');
            this.loadSubjects();
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

