import { Component, OnInit } from '@angular/core';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, TableAction } from '../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../shared/components/advanced-search-sidebar/search-field.interface';
import { Router } from '@angular/router';

interface Student {
  id: string;
  name: string;
  avatar: string;
  class: string;
  dob: string;
  parentName: string;
  mobile: string;
  address: string;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [data]="students"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Students List'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)">
    </app-data-table>
  `,
  styles: [`
    :host {
      display: block;
    //   padding: var(--spacing-lg);
    }
    
    @media (max-width: 768px) {
      :host {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class StudentListComponent implements OnInit {
  loading = false;
  students: Student[] = [
    {
      id: 'PRE2209',
      name: 'Aaliyah',
      avatar: 'https://placehold.co/40x40/4caf50/ffffff?text=A',
      class: '10 A',
      dob: '2 Feb 2002',
      parentName: 'Jeffrey Wong',
      mobile: '097 3584 5870',
      address: '911 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2210',
      name: 'Malynne',
      avatar: 'https://placehold.co/40x40/2196f3/ffffff?text=M',
      class: '10 A',
      dob: '3 Feb 2002',
      parentName: 'John Doe',
      mobile: '097 3584 5871',
      address: '912 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2211',
      name: 'Sarah',
      avatar: 'https://placehold.co/40x40/ff9800/ffffff?text=S',
      class: '9 B',
      dob: '4 Feb 2002',
      parentName: 'Jane Smith',
      mobile: '097 3584 5872',
      address: '913 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2212',
      name: 'Michael',
      avatar: 'https://placehold.co/40x40/f44336/ffffff?text=M',
      class: '11 C',
      dob: '5 Feb 2002',
      parentName: 'Robert Johnson',
      mobile: '097 3584 5873',
      address: '914 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2213',
      name: 'Emily',
      avatar: 'https://placehold.co/40x40/9c27b0/ffffff?text=E',
      class: '10 A',
      dob: '6 Feb 2002',
      parentName: 'David Wilson',
      mobile: '097 3584 5874',
      address: '915 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2214',
      name: 'James',
      avatar: 'https://placehold.co/40x40/00bcd4/ffffff?text=J',
      class: '9 A',
      dob: '7 Feb 2002',
      parentName: 'William Brown',
      mobile: '097 3584 5875',
      address: '916 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2215',
      name: 'Sophia',
      avatar: 'https://placehold.co/40x40/8bc34a/ffffff?text=S',
      class: '10 B',
      dob: '8 Feb 2002',
      parentName: 'Thomas Davis',
      mobile: '097 3584 5876',
      address: '917 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2216',
      name: 'Daniel',
      avatar: 'https://placehold.co/40x40/ffc107/ffffff?text=D',
      class: '11 A',
      dob: '9 Feb 2002',
      parentName: 'Charles Miller',
      mobile: '097 3584 5877',
      address: '918 Deer Ridge Drive, USA'
    }
  ];
  
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
    exportable: true,
    responsive: true,
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
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Initialize component
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
    // Implement export functionality
    if (format === 'csv') {
      this.exportToCSV();
    }
  }
  
  exportToCSV(): void {
    const csvContent = this.convertToCSV(this.students);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
  convertToCSV(data: Student[]): string {
    const headers = ['ID', 'Name', 'Class', 'DOB', 'Parent Name', 'Mobile', 'Address'];
    const rows = data.map(student => [
      student.id,
      student.name,
      student.class,
      student.dob,
      student.parentName,
      student.mobile,
      student.address
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}
