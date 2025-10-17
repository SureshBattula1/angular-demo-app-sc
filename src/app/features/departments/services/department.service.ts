import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Department, DepartmentFormData } from '../../../core/models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly ENDPOINT = '/departments';

  constructor(private apiService: ApiService) {}

  getDepartments(params?: Record<string, unknown>): Observable<ApiResponse<Department[]>> {
    return this.apiService.get<Department[]>(this.ENDPOINT, params);
  }

  getDepartment(id: number): Observable<ApiResponse<Department>> {
    return this.apiService.get<Department>(`${this.ENDPOINT}/${id}`);
  }

  createDepartment(departmentData: DepartmentFormData): Observable<ApiResponse<Department>> {
    return this.apiService.post<Department>(this.ENDPOINT, departmentData);
  }

  updateDepartment(id: number, departmentData: Partial<DepartmentFormData>): Observable<ApiResponse<Department>> {
    return this.apiService.put<Department>(`${this.ENDPOINT}/${id}`, departmentData);
  }

  deleteDepartment(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  toggleStatus(id: number): Observable<ApiResponse<Department>> {
    return this.apiService.put<Department>(`${this.ENDPOINT}/${id}/toggle-status`, {});
  }
}

