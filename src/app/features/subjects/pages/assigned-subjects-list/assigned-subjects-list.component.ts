import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { SectionSubjectService, SectionSubjectAssignment } from '../../services/section-subject.service';
import { BranchService } from '../../../branches/services/branch.service';
import { SectionService } from '../../../sections/services/section.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
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
      (searchFieldChanged)="onSearchFieldChanged($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)"
      (searchResetEvent)="onSearchReset()">
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
  private selectedBranchId: string | number | null = null;
  
  tableConfig: TableConfig = {
    columns: [
      { 
        key: 'section.name', 
        header: 'Section', 
        sortable: true,
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
        sortable: true, 
        width: '130px' 
      },
      { 
        key: 'subject.name', 
        header: 'Subject Name', 
        sortable: true 
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
        sortable: true, 
        width: '180px' 
      },
      { 
        key: 'branch.name', 
        header: 'Branch', 
        sortable: true,
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
        sortable: true,
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
    private teacherService: TeacherService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadBranches();
    this.setSectionOptions([]);
    // Default: branch-wise sorting
    this.currentFilters = { ...this.currentFilters, sort_by: 'branch_id', sort_direction: 'asc' };
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
  
  private setSectionOptions(options: Array<{ value: any; label: string; disabled?: boolean }>): void {
    const sectionField = this.advancedSearchConfig.fields.find(f => f.key === 'section_id');
    if (sectionField) sectionField.options = options;
  }

  private loadSectionsForBranch(branchId: string | number): void {
    this.setSectionOptions([{ value: '', label: 'Loading sections...', disabled: true }]);
    this.sectionService.getSections({ branch_id: branchId, is_active: true, per_page: 1000 }).subscribe({
      next: (response) => {
        const options = (response.success && response.data)
          ? response.data.map((section: any) => ({
              value: section.id,
              label: `${section.name} - ${section.grade_label || 'Grade ' + section.grade_level}`
            }))
          : [];
        this.setSectionOptions(options);
      },
      error: () => this.setSectionOptions([])
    });
  }

  onSearchFieldChanged(event: { field: string; value: any }): void {
    if (event.field === 'branch_id') {
      this.selectedBranchId = event.value || null;
      // Clear dependent field options
      this.setSectionOptions([]);
      if (this.selectedBranchId) {
        this.loadSectionsForBranch(this.selectedBranchId);
      }
    }
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
    const columnMapping: Record<string, string> = {
      'branch.name': 'branch_id',
      'academic_year': 'academic_year',
      'is_active': 'is_active',
      // Note: these sort by IDs on the backend (fast, but not alphabetical by name)
      'section.name': 'section_id',
      'subject.code': 'subject_id',
      'subject.name': 'subject_id',
      'teacher.first_name': 'teacher_id',
    };

    const sortColumn = columnMapping[event.field] || event.field;

    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
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

  onSearchReset(): void {
    this.currentFilters = { sort_by: 'branch_id', sort_direction: 'asc' };
    this.selectedBranchId = null;
    this.setSectionOptions([]);
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
    // Navigate to subject view page with returnTab to preserve active tab
    this.router.navigate(['/subjects/view', assignment.subject_id], {
      queryParams: { returnTab: 'assignments' }
    });
  }
  
  editAssignment(assignment: SectionSubjectAssignment): void {
    // Open dialog to change teacher assignment
    const dialogRef = this.dialog.open(EditAssignmentDialogComponent, {
      width: '500px',
      data: { assignment }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAssignments();
      }
    });
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

// Dialog Component for Editing Teacher Assignment
@Component({
  selector: 'app-edit-assignment-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit</mat-icon>
      Edit Subject Assignment
    </h2>
    
    <mat-dialog-content>
      <div class="assignment-info">
        <div class="info-item">
          <mat-icon>class</mat-icon>
          <span><strong>Section:</strong> {{ data.assignment.section?.name }} (Grade {{ data.assignment.section?.grade_level }})</span>
        </div>
        <div class="info-item">
          <mat-icon>book</mat-icon>
          <span><strong>Subject:</strong> {{ data.assignment.subject?.name }} ({{ data.assignment.subject?.code }})</span>
        </div>
      </div>

      <mat-divider></mat-divider>

      <form [formGroup]="editForm" class="edit-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Assign Teacher</mat-label>
          <mat-select formControlName="teacher_id">
            <mat-option [value]="null">-- No Teacher --</mat-option>
            <mat-option *ngFor="let teacher of teachers" [value]="teacher.user_id">
              {{ teacher.user?.first_name }} {{ teacher.user?.last_name }}
              <span *ngIf="teacher.department?.name" class="teacher-dept"> - {{ teacher.department.name }}</span>
            </mat-option>
          </mat-select>
          <mat-icon matPrefix>person</mat-icon>
          <mat-hint>Current: {{ getCurrentTeacherName() }}</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>cancel</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="saving || editForm.invalid">
        <mat-spinner *ngIf="saving" diameter="20" class="spinner-inline"></mat-spinner>
        <mat-icon *ngIf="!saving">save</mat-icon>
        {{ saving ? 'Saving...' : 'Update Assignment' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .assignment-info {
      margin: 16px 0;
      
      .info-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        
        mat-icon {
          color: var(--primary-color);
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        
        span {
          font-size: 14px;
          color: var(--text-primary);
        }
      }
    }
    
    mat-divider {
      margin: 16px 0;
    }
    
    .edit-form {
      margin-top: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .teacher-dept {
      color: var(--text-secondary);
      font-size: 12px;
    }
    
    .spinner-inline {
      display: inline-block;
      margin-right: 8px;
    }
    
    mat-dialog-content {
      min-height: 200px;
    }
  `]
})
export class EditAssignmentDialogComponent implements OnInit {
  editForm!: FormGroup;
  teachers: any[] = [];
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<EditAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { assignment: SectionSubjectAssignment },
    private fb: FormBuilder,
    private sectionSubjectService: SectionSubjectService,
    private teacherService: TeacherService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      teacher_id: [this.data.assignment.teacher_id]
    });

    this.loadTeachers();
  }

  loadTeachers(): void {
    this.teacherService.getTeachers({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.teachers = response.data;
        }
      },
      error: (error) => {
        this.errorHandler.showError('Failed to load teachers');
      }
    });
  }

  getCurrentTeacherName(): string {
    const teacher = this.data.assignment.teacher;
    if (!teacher) return 'No teacher assigned';
    
    const firstName = teacher.first_name || teacher.user?.first_name || '';
    const lastName = teacher.last_name || teacher.user?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  }

  onSave(): void {
    if (this.editForm.invalid) return;

    this.saving = true;
    const formData = {
      teacher_id: this.editForm.value.teacher_id
    };

    this.sectionSubjectService.updateAssignment(this.data.assignment.id, formData).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.errorHandler.showSuccess('Teacher assignment updated successfully');
          this.dialogRef.close(true);
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

