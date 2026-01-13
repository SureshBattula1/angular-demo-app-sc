import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent, PaginationEvent, SortEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { StudentCrudService } from '../../services/student-crud.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ExportService } from '../../../../shared/services/export.service';
import { Student } from '../../../../core/models/student.model';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="students"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Students'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)"
      (paginationChanged)="onPaginationChange($event)"
      (sortChanged)="onSortChange($event)"
      (searchFieldChanged)="onSearchFieldChanged($event)"
      (advancedSearchChanged)="onAdvancedSearchChange($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class StudentListComponent implements OnInit, AfterViewInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  students: Student[] = [];
  selectedStudents: Student[] = [];
  currentFilters: Record<string, unknown> = {};
  allSections: Section[] = []; // Store all sections for filtering
  currentGrade: string | null = null; // Track current grade selection
  currentBranch: string | null = null; // Track current branch selection
  
  tableConfig: TableConfig = {
    columns: [
      // { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'admission_number', header: 'Admission No.', sortable: true, searchable: true, width: '140px' },
      { key: 'full_name', header: 'Full Name', sortable: true, searchable: true },
      { key: 'gender', header: 'Gender', sortable: true, searchable: true },
      // { key: 'email', header: 'Email', searchable: true },
      { key: 'branch.name', header: 'Branch', sortable: true, width: '130px' },
      { key: 'grade_label', header: 'Class (Grade)', sortable: true, width: '120px' },
      { key: 'section', header: 'Section', sortable: true, width: '100px' },
      { key: 'roll_number', header: 'Roll No.', width: '100px' },
      { key: 'phone', header: 'Phone', width: '130px' },
      { key: 'student_status', header: 'Status', type: 'badge', width: '110px', align: 'center' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { 
        icon: 'visibility', 
        label: 'View Details', 
        action: (row) => this.viewStudent(row),
        permission: 'students.view'
      },
      { 
        icon: 'edit', 
        label: 'Edit', 
        color: 'primary', 
        action: (row) => this.editStudent(row),
        permission: ['students.edit', 'students.update'] // Support both permission names
      },
      { 
        icon: 'block', 
        label: 'Deactivate', 
        color: 'warn', 
        action: (row) => this.deactivateStudent(row),
        permission: 'students.delete',
        show: (row) => !row.deleted_at // Show only if not deleted
      },
      { 
        icon: 'restore', 
        label: 'Restore', 
        color: 'accent', 
        action: (row) => this.restoreStudent(row),
        permission: 'students.delete',
        show: (row) => !!row.deleted_at // Show only if deleted
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    exportButtonPermission: 'students.export', // Permission required for export button
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
    addButtonPermission: 'students.create' // Permission required for add button
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Student Search',
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
        options: [], // Will be populated dynamically
        // group: 'Basic Information'
      },
      {
        key: 'admission_number',
        label: 'Admission Number',
        type: 'text',
        placeholder: 'Enter admission number',
        icon: 'badge',
        // group: 'Basic Information'
      },
      {
        key: 'roll_number',
        label: 'Roll Number',
        type: 'text',
        placeholder: 'Enter roll number',
        icon: 'numbers',
        // group: 'Basic Information'
      },
      {
        key: 'grade',
        label: 'Grade',
        type: 'select',
        icon: 'school',
        options: [], // Will be populated dynamically
        // group: 'Academic'
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        icon: 'class',
        options: [], // Will be populated dynamically based on selected grade
        dependsOn: 'grade', // Section field depends on grade selection
         // group: 'Academic'
      },
      {
        key: 'status',
        label: 'Student Status',
        type: 'select',
        icon: 'info',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Graduated', label: 'Graduated' },
          { value: 'Left', label: 'Left' },
          { value: 'Suspended', label: 'Suspended' },
          { value: 'Expelled', label: 'Expelled' }
        ],
        // group: 'Status'
      },
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        icon: 'person',
        options: [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
          { value: 'Other', label: 'Other' }
        ],
        // group: 'Personal'
      },
      {
        key: 'is_active',
        label: 'Account Status',
        type: 'select',
        icon: 'toggle_on',
        placeholder: 'Select account status',
        options: [
          { value: 'true', label: 'Active Accounts' },
          { value: 'false', label: 'Inactive Accounts' }
        ],
        // group: 'Status'
      }
    ]
  };
  
  constructor(
    private studentCrudService: StudentCrudService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private branchService: BranchService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService
  ) {}
  
  ngOnInit(): void {
    // ✅ OPTIMIZED: Load all filter data in parallel instead of sequentially
    this.loadFilterData();
    this.loadStudents();
  }
  
  /**
   * ✅ OPTIMIZED: Load all filter data (branches, grades, sections) in parallel
   * This reduces total load time from ~3-4 seconds to ~1 second
   */
  loadFilterData(): void {
    forkJoin({
      branches: this.branchService.getBranches({ is_active: true }),
      grades: this.gradeService.getGrades(),
      sections: this.sectionService.getSections({ per_page: 1000, is_active: true })
    }).subscribe({
      next: (responses) => {
        // Process branches
        if (responses.branches.success && responses.branches.data) {
          const branchField = this.advancedSearchConfig.fields.find(f => f.key === 'branch_id');
          if (branchField) {
            branchField.options = responses.branches.data.map(branch => ({
              value: branch.id.toString(),
              label: branch.name
            }));
          }
        }
        
        // Process grades
        if (responses.grades.success && responses.grades.data) {
          const gradeField = this.advancedSearchConfig.fields.find(f => f.key === 'grade');
          if (gradeField) {
            gradeField.options = responses.grades.data.map(grade => ({
              value: grade.value,
              label: grade.label
            }));
          }
        }
        
        // Process sections
        if (responses.sections.success && responses.sections.data) {
          this.allSections = responses.sections.data;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }
  
  ngAfterViewInit(): void {
    // No additional setup needed
  }
  
  /**
   * Update section options based on selected grade and branch
   */
  updateSectionOptions(selectedGrade: string | null, selectedBranch: string | null = null): void {
    const sectionField = this.advancedSearchConfig.fields.find(f => f.key === 'section');
    if (!sectionField) return;
    
    let filteredSections = this.allSections;
    
    // Filter by grade if selected
    if (selectedGrade) {
      filteredSections = filteredSections.filter(
        section => String(section.grade_level) === String(selectedGrade)
      );
    }
    
    // Filter by branch if selected
    if (selectedBranch) {
      filteredSections = filteredSections.filter(
        section => Number(section.branch_id) === Number(selectedBranch)
      );
    }
    
    // Only show active sections
    filteredSections = filteredSections.filter(section => section.is_active);
    
    // Update section options
    sectionField.options = filteredSections.map(section => ({
      value: section.name,
      label: `${section.name} ${section.code ? '(' + section.code + ')' : ''}`
    }));
  }
  
  loadStudents(): void {
    this.loading = true;
    
    this.studentCrudService.getStudents(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.students = (response.data || []).map(student => ({
            ...student,
            full_name: this.getFullName(student)
          }));
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
  
  onSearchFieldChanged(event: { field: string, value: any }): void {
    // Update sections when grade or branch field changes
    if (event.field === 'grade') {
      this.currentGrade = event.value;
      this.updateSectionOptions(this.currentGrade, this.currentBranch);
    } else if (event.field === 'branch_id') {
      this.currentBranch = event.value;
      this.updateSectionOptions(this.currentGrade, this.currentBranch);
    }
  }
  
  /**
   * Handle pagination changes
   */
  onPaginationChange(event: PaginationEvent): void {
    this.currentFilters = {
      ...this.currentFilters,
      page: event.page + 1, // Backend expects 1-based page numbers
      per_page: event.pageSize
    };
    this.loadStudents();
  }
  
  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    // Map frontend column names to backend column names
    const columnMapping: Record<string, string> = {
      'full_name': 'users.first_name',
      'admission_number': 'students.admission_number',
      'roll_number': 'students.roll_number',
      'gender': 'students.gender',
      'grade_label': 'students.grade',
      'section': 'students.section',
      'student_status': 'students.student_status',
      'branch.name': 'branches.name'
    };
    
    const sortColumn = columnMapping[event.field] || event.field;
    
    this.currentFilters = {
      ...this.currentFilters,
      sort_by: sortColumn,
      sort_direction: event.direction
    };
    this.loadStudents();
  }

  onAdvancedSearchChange(event: SearchEvent): void {
    // Reset to first page when searching
    this.currentFilters = {
      ...event.filters,
      search: event.query,
      page: 1
    };
    this.loadStudents();
  }
  
  onAction(event: { action: string, row: Student | null }): void {
    if (event.action === 'add') {
      this.router.navigate(['/students/create']);
    }
  }
  
  onRowClick(row: Student): void {
    this.viewStudent(row);
  }
  
  onSelectionChange(selected: Student[]): void {
    this.selectedStudents = selected;
  }
  
  viewStudent(student: Student): void {
    this.router.navigate(['/students/view', student.id]);
  }
  
  editStudent(student: Student): void {
    this.router.navigate(['/students/edit', student.id]);
  }
  
  deactivateStudent(student: Student): void {
    const studentName = this.getFullName(student);
    if (confirm(`Are you sure you want to deactivate student "${studentName}"?\n\nDeactivated students will not appear in:\n- Attendance marking\n- Exam assignments\n- Fee management\n- Class lists\n\nYou can restore them later from the inactive students list.`)) {
      this.studentCrudService.deleteStudent(student.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess(`Student "${studentName}" deactivated successfully`);
            this.loadStudents();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  restoreStudent(student: Student): void {
    const studentName = this.getFullName(student);
    if (confirm(`Are you sure you want to restore/activate student "${studentName}"?`)) {
      this.studentCrudService.restoreStudent(student.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess(`Student "${studentName}" restored successfully`);
            this.loadStudents();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  onExport(format: 'excel' | 'pdf' | 'csv'): void {
    // Show loading state
    this.errorHandler.showInfo(`Exporting as ${format.toUpperCase()}...`);
    
    // Call export service with current filters
    this.exportService.export(
      {
        endpoint: '/students/export',
        filename: 'students'
      },
      {
        format: format,
        filters: this.currentFilters
      }
    );
  }

  /**
   * Get full name (first + last)
   */
  getFullName(student: Student): string {
    const parts = [];
    if (student.first_name) parts.push(student.first_name);
    if (student.last_name) parts.push(student.last_name);
    return parts.join(' ');
  }
}

