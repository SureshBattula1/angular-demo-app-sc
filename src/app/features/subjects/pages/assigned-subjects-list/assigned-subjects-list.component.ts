import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { SectionSubjectService, SectionSubjectAssignment } from '../../services/section-subject.service';
import { BranchService } from '../../../branches/services/branch.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-assigned-subjects-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="assignments"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Subject Assignments'"
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
  styles: [`:host { display: block; }`]
})
export class AssignedSubjectsListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  assignments: SectionSubjectAssignment[] = [];
  selectedAssignments: SectionSubjectAssignment[] = [];
  currentFilters: Record<string, unknown> = {};
  
  tableConfig: TableConfig = {
    columns: [
      { 
        key: 'section.name', 
        header: 'Section', 
        sortable: false, 
        width: '120px' 
      },
      { 
        key: 'section.grade_label', 
        header: 'Grade', 
        sortable: false, 
        width: '130px' 
      },
      { 
        key: 'subject.code', 
        header: 'Subject Code', 
        sortable: false, 
        width: '130px' 
      },
      { 
        key: 'subject.name', 
        header: 'Subject Name', 
        sortable: false 
      },
      { 
        key: 'subject.type', 
        header: 'Type', 
        type: 'badge', 
        width: '110px', 
        align: 'center' 
      },
      { 
        key: 'teacher.first_name', 
        header: 'Teacher', 
        sortable: false, 
        width: '180px' 
      },
      { 
        key: 'branch.name', 
        header: 'Branch', 
        sortable: false, 
        width: '150px' 
      },
      { 
        key: 'academic_year', 
        header: 'Academic Year', 
        sortable: true, 
        width: '140px' 
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
        action: (row) => this.viewAssignment(row)
      },
      {
        icon: 'edit',
        label: 'Change Teacher',
        color: 'primary',
        action: (row) => this.editAssignment(row)
      },
      {
        icon: 'delete',
        label: 'Remove',
        color: 'warn',
        action: (row) => this.removeAssignment(row)
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
    defaultPageSize: 25
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Assignment Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        placeholder: 'Select branch',
        icon: 'business',
        options: []
      },
      {
        key: 'section_id',
        label: 'Section',
        type: 'select',
        placeholder: 'Select section',
        icon: 'class',
        options: []
      },
      {
        key: 'academic_year',
        label: 'Academic Year',
        type: 'text',
        placeholder: 'e.g., 2024-2025',
        icon: 'event'
      },
      {
        key: 'is_active',
        label: 'Active Only',
        type: 'checkbox',
        icon: 'check_circle'
      }
    ]
  };
  
  constructor(
    private sectionSubjectService: SectionSubjectService,
    private branchService: BranchService,
    private sectionService: SectionService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.loadSections();
    this.loadAssignments();
  }
  
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const branchField = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = response.data.map((branch: any) => ({
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
  
  loadSections(): void {
    this.sectionService.getSections({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const sectionField = this.advancedSearchConfig.fields.find(f => f.key === 'section_id');
          if (sectionField) {
            sectionField.options = response.data.map(section => ({
              value: section.id,
              label: `${section.name} - ${section.grade_label || 'Grade ' + section.grade_level}`
            }));
          }
        }
      },
      error: (error) => {
        console.error('Error loading sections:', error);
      }
    });
  }
  
  loadAssignments(): void {
    this.loading = true;
    
    this.sectionSubjectService.getAssignments(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.assignments = response.data || [];
          if (response.meta) {
            this.tableConfig = { ...this.tableConfig, totalCount: response.meta.total };
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
    this.loadAssignments();
  }
  
  onSortChange(event: SortEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: event.field,
      sort_direction: event.direction
    };
    this.loadAssignments();
  }
  
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadAssignments();
  }
  
  onAction(event: { action: string, row: SectionSubjectAssignment | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/subjects/assign']);
    }
  }
  
  onRowClick(row: SectionSubjectAssignment): void {
    this.viewAssignment(row);
  }
  
  onSelectionChange(selected: SectionSubjectAssignment[]): void {
    this.selectedAssignments = selected;
  }
  
  viewAssignment(assignment: SectionSubjectAssignment): void {
    // Can navigate to section view or subject view
    this.router.navigate(['/sections/view', assignment.section_id]);
  }
  
  editAssignment(assignment: SectionSubjectAssignment): void {
    // For now, just show a message. Can enhance later
    this.errorHandler.showInfo('Teacher change feature - Coming soon');
  }
  
  removeAssignment(assignment: SectionSubjectAssignment): void {
    const subjectName = assignment.subject?.name || 'this subject';
    const sectionName = assignment.section?.name || 'the section';
    
    if (confirm(`Are you sure you want to remove "${subjectName}" from section ${sectionName}?`)) {
      this.sectionSubjectService.removeSubject(assignment.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Subject removed successfully');
            this.loadAssignments();
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

