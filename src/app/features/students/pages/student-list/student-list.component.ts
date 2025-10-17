import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, SearchEvent } from '../../../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../../../shared/components/advanced-search-sidebar/search-field.interface';
import { StudentCrudService } from '../../services/student-crud.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Student } from '../../../../core/models/student.model';

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
      [title]="'Student Management'"
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
export class StudentListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  students: Student[] = [];
  selectedStudents: Student[] = [];
  currentFilters: Record<string, unknown> = {};
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'id', header: 'ID', sortable: true, width: '80px' },
      { key: 'admission_number', header: 'Admission No.', sortable: true, searchable: true, width: '140px' },
      { key: 'first_name', header: 'First Name', sortable: true, searchable: true },
      { key: 'last_name', header: 'Last Name', sortable: true, searchable: true },
      { key: 'email', header: 'Email', searchable: true },
      { key: 'grade', header: 'Grade', sortable: true, width: '100px' },
      { key: 'section', header: 'Section', sortable: true, width: '100px' },
      { key: 'roll_number', header: 'Roll No.', width: '100px' },
      { key: 'phone', header: 'Phone', width: '130px' },
      { key: 'student_status', header: 'Status', type: 'badge', width: '110px', align: 'center' },
      { key: 'is_active', header: 'Active', type: 'badge', width: '90px', align: 'center' }
    ],
    actions: [
      { icon: 'visibility', label: 'View Details', action: (row) => this.viewStudent(row) },
      { icon: 'edit', label: 'Edit', color: 'primary', action: (row) => this.editStudent(row) },
      { icon: 'delete', label: 'Delete', color: 'warn', action: (row) => this.deleteStudent(row) }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 10
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Student Search',
    width: '500px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'admission_number',
        label: 'Admission Number',
        type: 'text',
        placeholder: 'Enter admission number',
        icon: 'badge',
        group: 'Basic Information'
      },
      {
        key: 'roll_number',
        label: 'Roll Number',
        type: 'text',
        placeholder: 'Enter roll number',
        icon: 'numbers',
        group: 'Basic Information'
      },
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
        group: 'Academic'
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
        group: 'Academic'
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
        group: 'Status'
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
        group: 'Personal'
      }
    ]
  };
  
  constructor(
    private studentCrudService: StudentCrudService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.loadStudents();
  }
  
  loadStudents(): void {
    this.loading = true;
    
    this.studentCrudService.getStudents(this.currentFilters).subscribe({
      next: (response) => {
        if (response.success) {
          this.students = response.data || [];
          if (response.meta) {
            this.tableConfig.totalCount = response.meta.total;
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
  
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentFilters = {
      ...event.filters,
      search: event.query
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
  
  deleteStudent(student: Student): void {
    if (confirm(`Are you sure you want to delete student "${student.first_name} ${student.last_name}"?`)) {
      this.studentCrudService.deleteStudent(student.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Student deleted successfully');
            this.loadStudents();
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

