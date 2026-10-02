import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Student, StudentListRequest, StudentListResponse } from '../../core/models/student.model';
import { StudentCrudService } from './services/student-crud.service';
import { ApiResponse } from '../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  
  constructor(private studentCrudService: StudentCrudService) {}

  /**
   * Get students with server-side pagination, sorting, and filtering
   * @param request - Server table request with pagination, sort, and search
   * @returns Observable of StudentListResponse
   */
  getStudents(request: StudentListRequest): Observable<StudentListResponse> {
    // Convert request to API params
    const params: Record<string, unknown> = {
      page: request.pagination.page + 1, // Backend expects 1-based page numbers
      per_page: request.pagination.pageSize
    };

    // Add search query
    if (request.search?.query) {
      params['search'] = request.search.query;
    }

    // Add filters
    if (request.search?.filters) {
      Object.keys(request.search.filters).forEach(key => {
        const value = request.search!.filters![key];
        if (value !== null && value !== undefined && value !== '') {
          params[key] = value;
        }
      });
    }

    // Add sorting
    if (request.sort) {
      // Map frontend column names to backend column names
      const columnMapping: Record<string, string> = {
        'first_name': 'users.first_name',
        'last_name': 'users.last_name',
        'admission_number': 'students.admission_number',
        'roll_number': 'students.roll_number',
        'gender': 'students.gender',
        'grade_label': 'students.grade',
        'section': 'students.section',
        'student_status': 'students.student_status',
        'name': 'users.first_name' // fallback
      };
      
      const sortColumn = columnMapping[request.sort.field] || request.sort.field;
      params['sort_by'] = sortColumn;
      params['sort_direction'] = request.sort.direction;
    }

    return this.studentCrudService.getStudents(params).pipe(
      map((response: ApiResponse<Student[]>) => {
        // Transform API response to StudentListResponse format
        const data = response.data || [];
        const meta = response.meta || {
          total: 0,
          current_page: 1,
          per_page: request.pagination.pageSize,
          last_page: 1
        };

        return {
          data: data,
          total: meta.total || 0,
          page: (meta.current_page || 1) - 1, // Convert to 0-based for frontend
          pageSize: meta.per_page || request.pagination.pageSize,
          totalPages: meta.last_page || 1,
          hasNext: meta.has_more_pages || false,
          hasPrevious: (meta.current_page || 1) > 1
        };
      })
    );
  }

  /**
   * Get a single student by ID
   * @param id - Student ID
   * @returns Observable of Student
   */
  getStudentById(id: string | number): Observable<Student | null> {
    return this.studentCrudService.getStudent(id).pipe(
      map((response: ApiResponse<Student>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Create a new student
   * @param student - Student data
   * @returns Observable of Student
   */
  createStudent(student: Partial<Student>): Observable<Student> {
    return this.studentCrudService.createStudent(student as any).pipe(
      map((response: ApiResponse<Student>) => {
        return response.data!;
      })
    );
  }

  /**
   * Update an existing student
   * @param id - Student ID
   * @param student - Updated student data
   * @returns Observable of Student
   */
  updateStudent(id: string | number, student: Partial<Student>): Observable<Student> {
    return this.studentCrudService.updateStudent(id, student as any).pipe(
      map((response: ApiResponse<Student>) => {
        return response.data!;
      })
    );
  }

  /**
   * Delete a student
   * @param id - Student ID
   * @returns Observable of boolean
   */
  deleteStudent(id: string | number): Observable<boolean> {
    return this.studentCrudService.deleteStudent(id).pipe(
      map((response: ApiResponse) => {
        return response.success;
      })
    );
  }

  /**
   * Export students data
   * Note: Export is handled by ExportService in the list component
   * This method is kept for backward compatibility
   */
  exportStudents(format: string, filters?: any): Observable<Blob> {
    // Export is now handled by the shared ExportService
    // This is a placeholder for backward compatibility
    throw new Error('Use ExportService.export() instead for student exports');
  }
}
