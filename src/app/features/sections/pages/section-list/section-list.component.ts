import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { SectionService } from '../../services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="sections"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Section Management'"
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
export class SectionListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  sections: Section[] = [];
  selectedSections: Section[] = [];
  currentFilters: Record<string, unknown> = {};
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'code', header: 'Code', sortable: true, searchable: true, width: '120px' },
      { key: 'name', header: 'Section Name', sortable: true, searchable: true },
      { key: 'grade_level', header: 'Grade Level', sortable: true, width: '120px' },
      { key: 'capacity', header: 'Capacity', type: 'number', align: 'center', width: '100px' },
      { key: 'current_strength', header: 'Students', type: 'number', align: 'center', width: '100px' },
      { key: 'room_number', header: 'Room', sortable: true, width: '100px' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewSection(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editSection(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteSection(row) }
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
    title: 'Advanced Section Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'code',
        label: 'Section Code',
        type: 'text',
        placeholder: 'Enter section code',
        icon: 'qr_code',
        group: 'Basic Information'
      },
      {
        key: 'name',
        label: 'Section Name',
        type: 'text',
        placeholder: 'Enter section name',
        icon: 'class',
        group: 'Basic Information'
      },
      {
        key: 'grade_level',
        label: 'Grade Level',
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
    private sectionService: SectionService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadSections();
  }
  
  loadSections(): void {
    this.loading = true;
    
    this.sectionService.getSections(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sections = response.data;
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
    this.loadSections();
  }
  
  onAction(event: { action: string, row: Section | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/sections/create']);
    }
  }
  
  onRowClick(row: Section): void {
    this.viewSection(row);
  }
  
  onSelectionChange(selected: Section[]): void {
    this.selectedSections = selected;
  }
  
  viewSection(section: Section): void {
    this.router.navigate(['/sections/view', section.id]);
  }
  
  editSection(section: Section): void {
    this.router.navigate(['/sections/edit', section.id]);
  }
  
  deleteSection(section: Section): void {
    if (confirm(`Are you sure you want to delete section "${section.name}"?`)) {
      this.sectionService.deleteSection(section.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Section deleted successfully');
            this.loadSections();
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

