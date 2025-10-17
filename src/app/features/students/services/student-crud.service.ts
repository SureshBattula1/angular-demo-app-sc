import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Student, StudentFormData } from '../../../core/models/student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentCrudService {
  private readonly ENDPOINT = '/students';

  constructor(private apiService: ApiService) {}

  /**
   * Get all students
   */
  getStudents(params?: Record<string, unknown>): Observable<ApiResponse<Student[]>> {
    return this.apiService.get<Student[]>(this.ENDPOINT, params);
  }

  /**
   * Get student by ID
   */
  getStudent(id: number): Observable<ApiResponse<Student>> {
    return this.apiService.get<Student>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new student
   */
  createStudent(studentData: StudentFormData): Observable<ApiResponse<Student>> {
    return this.apiService.post<Student>(this.ENDPOINT, studentData);
  }

  /**
   * Update student
   */
  updateStudent(id: number, studentData: Partial<StudentFormData>): Observable<ApiResponse<Student>> {
    return this.apiService.put<Student>(`${this.ENDPOINT}/${id}`, studentData);
  }

  /**
   * Delete student
   */
  deleteStudent(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Promote students
   */
  promoteStudents(data: {
    student_ids: number[];
    from_grade: string;
    to_grade: string;
    academic_year: string;
  }): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/promote`, data);
  }
}

