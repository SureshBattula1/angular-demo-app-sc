import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Teacher } from '../../../core/models/teacher.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private readonly ENDPOINT = 'teachers';

  constructor(private apiService: ApiService) {}

  // Get paginated teachers
  getTeachers(params: any): Observable<ApiResponse<any>> {
    return this.apiService.get(this.ENDPOINT, params);
  }

  // Get single teacher by ID
  getTeacher(id: string | number): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.ENDPOINT}/${id}`);
  }

  // Create teacher
  createTeacher(data: any): Observable<ApiResponse<Teacher>> {
    return this.apiService.post<Teacher>(this.ENDPOINT, data);
  }

  // Update teacher
  updateTeacher(id: string | number, data: any): Observable<ApiResponse<Teacher>> {
    return this.apiService.put<Teacher>(`${this.ENDPOINT}/${id}`, data);
  }

  // Delete teacher (soft delete - makes inactive)
  deleteTeacher(id: string | number): Observable<ApiResponse<any>> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  // Restore soft-deleted teacher (reactivate)
  restoreTeacher(id: string | number): Observable<ApiResponse<any>> {
    return this.apiService.post(`${this.ENDPOINT}/${id}/restore`, {});
  }

  // Upload profile picture
  uploadProfilePicture(id: string | number, file: File): Observable<ApiResponse<{file_path: string, file_url: string}>> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    // Use the POST method without extra headers to let browser set Content-Type with boundary
    return this.apiService.post<{file_path: string, file_url: string}>(`${this.ENDPOINT}/${id}/upload-profile-picture`, formData);
  }

  // Get teacher assignments
  getAssignments(teacherId: string | number): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.ENDPOINT}/${teacherId}/assignments`);
  }

  // Get teacher attendance
  getAttendance(teacherId: string | number, params: any): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.ENDPOINT}/${teacherId}/attendance`, params);
  }

  // Get teacher leaves
  getLeaves(teacherId: string | number, params: any): Observable<ApiResponse<any>> {
    return this.apiService.get(`${this.ENDPOINT}/${teacherId}/leaves`, params);
  }
}
