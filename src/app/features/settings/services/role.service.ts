import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Role, Permission } from '../../../core/models/role.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  /**
   * Get all roles with pagination
   */
  getRoles(params?: any): Observable<ApiResponse<PaginatedResponse<Role>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Role>>>(this.apiUrl, { params });
  }

  /**
   * Get all roles without pagination
   */
  getAllRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(`${this.apiUrl}/all`);
  }

  /**
   * Get single role by ID
   */
  getRole(id: number): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new role
   */
  createRole(role: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.apiUrl, role);
  }

  /**
   * Update existing role
   */
  updateRole(id: number, role: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${id}`, role);
  }

  /**
   * Delete role
   */
  deleteRole(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Assign permissions to role
   */
  assignPermissions(roleId: number, permissionIds: number[]): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(`${this.apiUrl}/${roleId}/permissions`, {
      permissions: permissionIds
    });
  }

  /**
   * Get role permissions
   */
  getRolePermissions(roleId: number): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}/${roleId}/permissions`);
  }
}

