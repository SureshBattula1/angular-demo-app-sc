import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Student, StudentListRequest, StudentListResponse } from '../../shared/interfaces/api.interface';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  
  // Mock data for demonstration - replace with actual HTTP calls
  private mockStudents: Student[] = [
    {
      id: 'PRE2209',
      name: 'Aaliyah',
      avatar: 'https://placehold.co/40x40/4caf50/ffffff?text=A',
      class: '10 A',
      dob: '2002-02-02',
      parentName: 'Jeffrey Wong',
      mobile: '097 3584 5870',
      address: '911 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'female',
      admissionDate: '2018-09-01',
      section: 'A',
      email: 'aaliyah@school.com',
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2023-01-15T10:30:00Z'
    },
    {
      id: 'PRE2210',
      name: 'Malynne',
      avatar: 'https://placehold.co/40x40/2196f3/ffffff?text=M',
      class: '10 A',
      dob: '2002-02-03',
      parentName: 'John Doe',
      mobile: '097 3584 5871',
      address: '912 Deer Ridge Drive, USA',
      status: 'inactive',
      gender: 'male',
      admissionDate: '2019-09-01',
      section: 'B',
      email: 'malynne@school.com',
      createdAt: '2023-01-16T10:30:00Z',
      updatedAt: '2023-01-16T10:30:00Z'
    },
    {
      id: 'PRE2211',
      name: 'Sarah',
      avatar: 'https://placehold.co/40x40/ff9800/ffffff?text=S',
      class: '9 B',
      dob: '2002-02-04',
      parentName: 'Jane Smith',
      mobile: '097 3584 5872',
      address: '913 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'female',
      admissionDate: '2017-09-01',
      section: 'A',
      email: 'sarah@school.com',
      createdAt: '2023-01-17T10:30:00Z',
      updatedAt: '2023-01-17T10:30:00Z'
    },
    {
      id: 'PRE2212',
      name: 'Michael',
      avatar: 'https://placehold.co/40x40/f44336/ffffff?text=M',
      class: '11 C',
      dob: '2002-02-05',
      parentName: 'Robert Johnson',
      mobile: '097 3584 5873',
      address: '914 Deer Ridge Drive, USA',
      status: 'alumni',
      gender: 'male',
      admissionDate: '2016-09-01',
      section: 'C',
      email: 'michael@school.com',
      createdAt: '2023-01-18T10:30:00Z',
      updatedAt: '2023-01-18T10:30:00Z'
    },
    {
      id: 'PRE2213',
      name: 'Emily',
      avatar: 'https://placehold.co/40x40/9c27b0/ffffff?text=E',
      class: '10 A',
      dob: '2002-02-06',
      parentName: 'David Wilson',
      mobile: '097 3584 5874',
      address: '915 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'female',
      admissionDate: '2018-09-15',
      section: 'A',
      email: 'emily@school.com',
      createdAt: '2023-01-19T10:30:00Z',
      updatedAt: '2023-01-19T10:30:00Z'
    },
    {
      id: 'PRE2214',
      name: 'James',
      avatar: 'https://placehold.co/40x40/00bcd4/ffffff?text=J',
      class: '9 A',
      dob: '2002-02-07',
      parentName: 'William Brown',
      mobile: '097 3584 5875',
      address: '916 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'male',
      admissionDate: '2019-09-01',
      section: 'A',
      email: 'james@school.com',
      createdAt: '2023-01-20T10:30:00Z',
      updatedAt: '2023-01-20T10:30:00Z'
    },
    {
      id: 'PRE2215',
      name: 'Sophia',
      avatar: 'https://placehold.co/40x40/8bc34a/ffffff?text=S',
      class: '10 B',
      dob: '2002-02-08',
      parentName: 'Thomas Davis',
      mobile: '097 3584 5876',
      address: '917 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'female',
      admissionDate: '2018-09-01',
      section: 'B',
      email: 'sophia@school.com',
      createdAt: '2023-01-21T10:30:00Z',
      updatedAt: '2023-01-21T10:30:00Z'
    },
    {
      id: 'PRE2216',
      name: 'Daniel',
      avatar: 'https://placehold.co/40x40/ffc107/ffffff?text=D',
      class: '11 A',
      dob: '2002-02-09',
      parentName: 'Charles Miller',
      mobile: '097 3584 5877',
      address: '918 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'male',
      admissionDate: '2017-09-01',
      section: 'A',
      email: 'daniel@school.com',
      createdAt: '2023-01-22T10:30:00Z',
      updatedAt: '2023-01-22T10:30:00Z'
    },
    {
      id: 'PRE2217',
      name: 'Olivia',
      avatar: 'https://placehold.co/40x40/e91e63/ffffff?text=O',
      class: '10 A',
      dob: '2002-02-10',
      parentName: 'Mark Wilson',
      mobile: '097 3584 5878',
      address: '919 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'female',
      admissionDate: '2018-09-01',
      section: 'A',
      email: 'olivia@school.com',
      createdAt: '2023-01-23T10:30:00Z',
      updatedAt: '2023-01-23T10:30:00Z'
    },
    {
      id: 'PRE2218',
      name: 'William',
      avatar: 'https://placehold.co/40x40/795548/ffffff?text=W',
      class: '11 B',
      dob: '2002-02-11',
      parentName: 'James Taylor',
      mobile: '097 3584 5879',
      address: '920 Deer Ridge Drive, USA',
      status: 'inactive',
      gender: 'male',
      admissionDate: '2017-09-01',
      section: 'B',
      email: 'william@school.com',
      createdAt: '2023-01-24T10:30:00Z',
      updatedAt: '2023-01-24T10:30:00Z'
    },
    {
      id: 'PRE2219',
      name: 'Ava',
      avatar: 'https://placehold.co/40x40/607d8b/ffffff?text=A',
      class: '9 B',
      dob: '2002-02-12',
      parentName: 'Robert Anderson',
      mobile: '097 3584 5880',
      address: '921 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'female',
      admissionDate: '2019-09-01',
      section: 'B',
      email: 'ava@school.com',
      createdAt: '2023-01-25T10:30:00Z',
      updatedAt: '2023-01-25T10:30:00Z'
    },
    {
      id: 'PRE2220',
      name: 'Noah',
      avatar: 'https://placehold.co/40x40/3f51b5/ffffff?text=N',
      class: '10 C',
      dob: '2002-02-13',
      parentName: 'Michael Thomas',
      mobile: '097 3584 5881',
      address: '922 Deer Ridge Drive, USA',
      status: 'active',
      gender: 'male',
      admissionDate: '2018-09-01',
      section: 'C',
      email: 'noah@school.com',
      createdAt: '2023-01-26T10:30:00Z',
      updatedAt: '2023-01-26T10:30:00Z'
    }
  ];

  /**
   * Get students with server-side pagination, sorting, and filtering
   * @param request - Server table request with pagination, sort, and search
   * @returns Observable of StudentListResponse
   */
  getStudents(request: StudentListRequest): Observable<StudentListResponse> {
    // Simulate API delay
    return of(this.mockGetStudents(request)).pipe(delay(500));
  }

  /**
   * Get a single student by ID
   * @param id - Student ID
   * @returns Observable of Student
   */
  getStudentById(id: string): Observable<Student | null> {
    const student = this.mockStudents.find(s => s.id === id);
    return of(student || null).pipe(delay(200));
  }

  /**
   * Create a new student
   * @param student - Student data
   * @returns Observable of Student
   */
  createStudent(student: Partial<Student>): Observable<Student> {
    const newStudent: Student = {
      id: `PRE${Date.now()}`,
      ...student,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Student;
    
    this.mockStudents.unshift(newStudent);
    return of(newStudent).pipe(delay(300));
  }

  /**
   * Update an existing student
   * @param id - Student ID
   * @param student - Updated student data
   * @returns Observable of Student
   */
  updateStudent(id: string, student: Partial<Student>): Observable<Student> {
    const index = this.mockStudents.findIndex(s => s.id === id);
    if (index !== -1) {
      this.mockStudents[index] = {
        ...this.mockStudents[index],
        ...student,
        updatedAt: new Date().toISOString()
      };
      return of(this.mockStudents[index]).pipe(delay(300));
    }
    throw new Error('Student not found');
  }

  /**
   * Delete a student
   * @param id - Student ID
   * @returns Observable of boolean
   */
  deleteStudent(id: string): Observable<boolean> {
    const index = this.mockStudents.findIndex(s => s.id === id);
    if (index !== -1) {
      this.mockStudents.splice(index, 1);
      return of(true).pipe(delay(200));
    }
    return of(false).pipe(delay(200));
  }

  /**
   * Export students data
   * @param format - Export format (csv, excel, pdf)
   * @param filters - Optional filters
   * @returns Observable of Blob
   */
  exportStudents(format: string, filters?: any): Observable<Blob> {
    // Mock export - in real implementation, this would call the API
    const csvContent = this.convertToCSV(this.mockStudents);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    return of(blob).pipe(delay(1000));
  }

  /**
   * Mock implementation of server-side data fetching
   * In real implementation, this would be replaced with HTTP calls
   */
  private mockGetStudents(request: StudentListRequest): StudentListResponse {
    let filteredStudents = [...this.mockStudents];

    // Apply search filters
    if (request.search?.query) {
      const query = request.search.query.toLowerCase();
      filteredStudents = filteredStudents.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query) ||
        student.parentName.toLowerCase().includes(query) ||
        student.mobile.includes(query) ||
        student.email?.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    if (request.search?.filters) {
      Object.keys(request.search.filters).forEach(key => {
        const filterValue = request.search!.filters![key];
        if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
          if (Array.isArray(filterValue)) {
            filteredStudents = filteredStudents.filter(student =>
              filterValue.includes(student[key as keyof Student])
            );
          } else {
            filteredStudents = filteredStudents.filter(student => {
              const studentValue = student[key as keyof Student];
              if (typeof studentValue === 'string') {
                return studentValue.toLowerCase().includes(filterValue.toString().toLowerCase());
              }
              return studentValue === filterValue;
            });
          }
        }
      });
    }

    // Apply sorting
    if (request.sort) {
      filteredStudents.sort((a, b) => {
        const aValue = a[request.sort!.field as keyof Student];
        const bValue = b[request.sort!.field as keyof Student];
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return request.sort!.direction === 'asc' ? 1 : -1;
        if (bValue === undefined) return request.sort!.direction === 'asc' ? -1 : 1;
        
        if (aValue < bValue) {
          return request.sort!.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return request.sort!.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // Calculate pagination
    const total = filteredStudents.length;
    const page = request.pagination.page;
    const pageSize = request.pagination.pageSize;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    return {
      data: paginatedStudents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNext: endIndex < total,
      hasPrevious: page > 0
    };
  }

  /**
   * Convert students to CSV format
   */
  private convertToCSV(students: Student[]): string {
    const headers = ['ID', 'Name', 'Class', 'DOB', 'Parent Name', 'Mobile', 'Email', 'Status', 'Address'];
    const rows = students.map(student => [
      student.id,
      student.name,
      student.class,
      student.dob,
      student.parentName,
      student.mobile,
      student.email || '',
      student.status || '',
      student.address
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}
