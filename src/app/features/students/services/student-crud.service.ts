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
  getStudent(id: string | number): Observable<ApiResponse<Student>> {
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
  updateStudent(id: string | number, studentData: Partial<StudentFormData>): Observable<ApiResponse<Student>> {
    return this.apiService.put<Student>(`${this.ENDPOINT}/${id}`, studentData);
  }

  /**
   * Delete student (soft delete - makes inactive)
   */
  deleteStudent(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Restore soft-deleted student (reactivate)
   */
  restoreStudent(id: string | number): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/${id}/restore`, {});
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(id: string | number, file: File): Observable<ApiResponse<{file_path: string, file_url: string}>> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    return this.apiService.post<{file_path: string, file_url: string}>(`${this.ENDPOINT}/${id}/upload-profile-picture`, formData);
  }
}

