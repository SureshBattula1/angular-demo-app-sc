import { Component, OnInit, ViewChild } from '@angular/core';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, TableAction } from '../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../shared/components/advanced-search-sidebar/search-field.interface';
import { Router } from '@angular/router';
import { StudentService } from './student.service';
import { Student, StudentListRequest, StudentListResponse } from '../../shared/interfaces/api.interface';
import { PaginationEvent, SortEvent, SearchEvent } from '../../shared/components/data-table/data-table.interface';

// Remove the duplicate Student interface since it's imported from api.interface

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      #dataTable
      [data]="students"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Students List'"
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
  styles: [`
    :host {
      display: block;
      /* padding: var(--spacing-lg); */
    }
    
    @media (max-width: 768px) {
      :host {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class StudentListComponent implements OnInit {
  @ViewChild('dataTable') dataTable!: DataTableComponent;
  
  loading = false;
  students: Student[] = [];
  
  // Server-side state
  currentRequest: StudentListRequest = {
    pagination: { page: 0, pageSize: 10 },
    sort: undefined,
    search: undefined
  };
  
  // Table Configuration
  tableConfig: TableConfig = {
    columns: [
      { 
        key: 'id', 
        header: 'ID', 
        sortable: true, 
        width: '100px',
        cellClass: 'student-id-cell'
      },
      { 
        key: 'avatar', 
        header: 'Avatar', 
        type: 'avatar',
        width: '80px',
        align: 'center'
      },
      { 
        key: 'name', 
        header: 'Name', 
        sortable: true, 
        searchable: true
      },
      { 
        key: 'class', 
        header: 'Class', 
        sortable: true,
        width: '100px'
      },
      { 
        key: 'dob', 
        header: 'DOB', 
        sortable: true,
        width: '120px'
      },
      { 
        key: 'parentName', 
        header: 'Parent Name', 
        searchable: true
      },
      { 
        key: 'mobile', 
        header: 'Mobile', 
        searchable: true,
        width: '150px'
      },
      { 
        key: 'address', 
        header: 'Address'
      }
    ],
    actions: [
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row) => this.editStudent(row)
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row) => this.deleteStudent(row)
      },
      {
        icon: 'visibility',
        label: 'View',
        action: (row) => this.viewStudent(row)
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    advancedSearch: true,
    exportable: true,
    responsive: true,
    serverSide: true,
    totalCount: 0,
    pageSizeOptions: [5, 10, 25, 50],
    defaultPageSize: 10
  };
  
  // Advanced Search Configuration
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Student Search',
    width: '450px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'id',
        label: 'Student ID',
        type: 'text',
        placeholder: 'Enter student ID',
        icon: 'badge',
        group: 'Basic Information'
      },
      {
        key: 'name',
        label: 'Student Name',
        type: 'text',
        placeholder: 'Enter student name',
        icon: 'person',
        group: 'Basic Information'
      },
      {
        key: 'class',
        label: 'Class',
        type: 'select',
        icon: 'school',
        options: [
          { value: '9 A', label: 'Class 9 A' },
          { value: '9 B', label: 'Class 9 B' },
          { value: '10 A', label: 'Class 10 A' },
          { value: '10 B', label: 'Class 10 B' },
          { value: '11 A', label: 'Class 11 A' },
          { value: '11 B', label: 'Class 11 B' },
          { value: '11 C', label: 'Class 11 C' }
        ],
        group: 'Academic'
      },
      {
        key: 'parentName',
        label: 'Parent Name',
        type: 'text',
        placeholder: 'Enter parent name',
        icon: 'people',
        group: 'Contact Information'
      },
      {
        key: 'mobile',
        label: 'Mobile Number',
        type: 'text',
        placeholder: 'Enter mobile number',
        icon: 'phone',
        group: 'Contact Information'
      },
      {
        key: 'address',
        label: 'Address',
        type: 'text',
        placeholder: 'Enter address',
        icon: 'location_on',
        group: 'Contact Information'
      }
    ]
  };
  
  constructor(
    private router: Router,
    private studentService: StudentService
  ) {}
  
  ngOnInit(): void {
    // Load initial data
    this.loadStudents();
  }
  
  /**
   * Load students from server with current request parameters
   */
  loadStudents(): void {
    this.loading = true;
    
    this.studentService.getStudents(this.currentRequest).subscribe({
      next: (response: StudentListResponse) => {
        this.students = response.data;
        this.tableConfig.totalCount = response.total;
        
        // Update data table with server response
        if (this.dataTable) {
          this.dataTable.updateServerData(response.data, response.total);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.loading = false;
      }
    });
  }
  
  /**
   * Handle pagination changes
   */
  onPaginationChange(event: PaginationEvent): void {
    this.currentRequest.pagination = {
      page: event.page,
      pageSize: event.pageSize
    };
    this.loadStudents();
  }
  
  /**
   * Handle sort changes
   */
  onSortChange(event: SortEvent): void {
    this.currentRequest.sort = {
      field: event.field,
      direction: event.direction
    };
    // Reset to first page when sorting
    this.currentRequest.pagination.page = 0;
    this.loadStudents();
  }
  
  /**
   * Handle advanced search changes
   */
  onAdvancedSearchChange(event: SearchEvent): void {
    this.currentRequest.search = {
      query: event.query,
      filters: event.filters
    };
    // Reset to first page when searching
    this.currentRequest.pagination.page = 0;
    this.loadStudents();
  }
  
  onAction(event: { action: string, row: any }): void {
    console.log('Action triggered:', event);
  }
  
  onRowClick(row: Student): void {
    console.log('Row clicked:', row);
    this.viewStudent(row);
  }
  
  onSelectionChange(selected: Student[]): void {
    console.log('Selected students:', selected);
  }
  
  editStudent(student: Student): void {
    console.log('Edit student:', student);
    // Navigate to edit page or open edit dialog
    // this.router.navigate(['/students/edit', student.id]);
  }
  
  deleteStudent(student: Student): void {
    console.log('Delete student:', student);
    // Implement delete confirmation and logic
    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
      this.students = this.students.filter(s => s.id !== student.id);
    }
  }
  
  viewStudent(student: Student): void {
    console.log('View student:', student);
    // Navigate to view page
    // this.router.navigate(['/students/view', student.id]);
  }
  
  onExport(format: string): void {
    console.log('Export as:', format);
    this.loading = true;
    
    // Use current search criteria for export
    this.studentService.exportStudents(format, this.currentRequest.search?.filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `students.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (error) => {
        console.error('Export error:', error);
        this.loading = false;
      }
    });
  }
}
