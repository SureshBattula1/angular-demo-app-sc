import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Student } from '../../core/models/student.model';
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
  getStudents(request: any = {}): Observable<any> {
    // Convert request to API params
    const params: Record<string, unknown> = {};

    if (request.pagination) {
      params['page'] = (request.pagination.page ?? 0) + 1; // Backend expects 1-based page numbers
      params['per_page'] = request.pagination.pageSize;
    } else if (request.page !== undefined) {
      params['page'] = request.page;
    }
    if (request.per_page !== undefined) {
      params['per_page'] = request.per_page;
    }

    // Add search query
    if (request.search?.query) {
      params['search'] = request.search.query;
    } else if (typeof request.search === 'string') {
      params['search'] = request.search;
    }

    // Add filters
    if (request.search?.filters) {
      Object.keys(request.search.filters).forEach(key => {
        const value = request.search.filters[key];
        if (value !== null && value !== undefined && value !== '') {
          params[key] = value;
        }
      });
    }

    // Pass through additional filters
    Object.keys(request).forEach(key => {
      if (!['pagination', 'search', 'sort', 'page', 'per_page'].includes(key) && request[key] !== undefined) {
        params[key] = request[key];
      }
    });

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
        const meta: any = response.meta || {
          total: data.length,
          current_page: 1,
          per_page: request.pagination?.pageSize || 25,
          last_page: 1
        };

        return {
          data: data,
          total: meta.total || data.length,
          page: (meta.current_page || 1) - 1, // Convert to 0-based for frontend
          pageSize: meta.per_page || request.pagination?.pageSize || 25,
          totalPages: meta.last_page || 1,
          hasNext: Boolean(meta.has_more_pages ?? ((meta.current_page || 1) < (meta.last_page || 1))),
          hasPrevious: (meta.current_page || 1) > 1,
          success: response.success,
          meta: meta
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
  exportStudents(_format: string, _filters?: any): Observable<Blob> {
    // Export is now handled by the shared ExportService
    // This is a placeholder for backward compatibility
    throw new Error('Use ExportService.export() instead for student exports');
  }
}
