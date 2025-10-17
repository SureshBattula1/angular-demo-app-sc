import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Teacher, TeacherFormData } from '../../../core/models/teacher.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private readonly ENDPOINT = '/teachers';

  constructor(private apiService: ApiService) {}

  getTeachers(params?: Record<string, unknown>): Observable<ApiResponse<Teacher[]>> {
    return this.apiService.get<Teacher[]>(this.ENDPOINT, params);
  }

  getTeacher(id: number): Observable<ApiResponse<Teacher>> {
    return this.apiService.get<Teacher>(`${this.ENDPOINT}/${id}`);
  }

  createTeacher(teacherData: TeacherFormData): Observable<ApiResponse<Teacher>> {
    return this.apiService.post<Teacher>(this.ENDPOINT, teacherData);
  }

  updateTeacher(id: number, teacherData: Partial<TeacherFormData>): Observable<ApiResponse<Teacher>> {
    return this.apiService.put<Teacher>(`${this.ENDPOINT}/${id}`, teacherData);
  }

  deleteTeacher(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }
}

