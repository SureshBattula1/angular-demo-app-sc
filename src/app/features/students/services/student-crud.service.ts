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
   * Upload profile picture
   */
  uploadProfilePicture(id: number, file: File): Observable<ApiResponse<{file_path: string, file_url: string}>> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    console.log('Uploading profile picture:', {
      studentId: id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    return this.apiService.post<{file_path: string, file_url: string}>(`${this.ENDPOINT}/${id}/upload-profile-picture`, formData);
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

