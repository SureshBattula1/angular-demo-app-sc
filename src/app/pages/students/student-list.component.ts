import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

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
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent implements OnInit {
  Math = Math; // Make Math available in template
  
  students: Student[] = [
    {
      id: 'PRE2209',
      name: 'Aaliyah',
      avatar: 'https://via.placeholder.com/40x40/4caf50/ffffff?text=A',
      class: '10 A',
      dob: '2 Feb 2002',
      parentName: 'Jeffrey Wong',
      mobile: '097 3584 5870',
      address: '911 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2210',
      name: 'Malynne',
      avatar: 'https://via.placeholder.com/40x40/2196f3/ffffff?text=M',
      class: '10 A',
      dob: '3 Feb 2002',
      parentName: 'John Doe',
      mobile: '097 3584 5871',
      address: '912 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2211',
      name: 'Sarah',
      avatar: 'https://via.placeholder.com/40x40/ff9800/ffffff?text=S',
      class: '9 B',
      dob: '4 Feb 2002',
      parentName: 'Jane Smith',
      mobile: '097 3584 5872',
      address: '913 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2212',
      name: 'Michael',
      avatar: 'https://via.placeholder.com/40x40/f44336/ffffff?text=M',
      class: '11 C',
      dob: '5 Feb 2002',
      parentName: 'Robert Johnson',
      mobile: '097 3584 5873',
      address: '914 Deer Ridge Drive, USA'
    },
    {
      id: 'PRE2213',
      name: 'Emily',
      avatar: 'https://via.placeholder.com/40x40/9c27b0/ffffff?text=E',
      class: '10 A',
      dob: '6 Feb 2002',
      parentName: 'David Wilson',
      mobile: '097 3584 5874',
      address: '915 Deer Ridge Drive, USA'
    }
  ];

  searchById = '';
  searchByName = '';
  searchByPhone = '';
  pageSize = 10;
  currentPage = 1;
  selectedStudents: string[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  onSearch(): void {
    console.log('Search by ID:', this.searchById);
    console.log('Search by Name:', this.searchByName);
    console.log('Search by Phone:', this.searchByPhone);
    // Implement search functionality
  }

  onPageSizeChange(): void {
    console.log('Page size changed to:', this.pageSize);
    this.currentPage = 1;
  }

  onDownload(): void {
    console.log('Download students data');
    // Implement download functionality
  }

  onAddStudent(): void {
    console.log('Add new student');
    // Navigate to add student page
  }

  onSelectStudent(studentId: string): void {
    const index = this.selectedStudents.indexOf(studentId);
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(studentId);
    }
  }

  onSelectAll(): void {
    if (this.selectedStudents.length === this.students.length) {
      this.selectedStudents = [];
    } else {
      this.selectedStudents = this.students.map(s => s.id);
    }
  }

  onEditStudent(student: Student): void {
    console.log('Edit student:', student);
    // Navigate to edit student page
  }

  onDeleteStudent(student: Student): void {
    console.log('Delete student:', student);
    // Implement delete functionality
  }

  isSelected(studentId: string): boolean {
    return this.selectedStudents.includes(studentId);
  }

  isAllSelected(): boolean {
    return this.selectedStudents.length === this.students.length && this.students.length > 0;
  }

  isIndeterminate(): boolean {
    return this.selectedStudents.length > 0 && this.selectedStudents.length < this.students.length;
  }
}
