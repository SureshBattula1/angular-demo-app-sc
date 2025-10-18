import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Permission } from '../../../core/models/role.model';

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
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/permissions`;

  constructor(private http: HttpClient) {}

  /**
   * Get all permissions with pagination
   */
  getPermissions(params?: any): Observable<ApiResponse<PaginatedResponse<Permission>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Permission>>>(this.apiUrl, { params });
  }

  /**
   * Get all permissions without pagination
   */
  getAllPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}/all`);
  }

  /**
   * Get permissions grouped by module
   */
  getPermissionsByModule(): Observable<ApiResponse<Record<string, Permission[]>>> {
    return this.http.get<ApiResponse<Record<string, Permission[]>>>(`${this.apiUrl}/by-module`);
  }

  /**
   * Get single permission by ID
   */
  getPermission(id: number): Observable<ApiResponse<Permission>> {
    return this.http.get<ApiResponse<Permission>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new permission
   */
  createPermission(permission: Partial<Permission>): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(this.apiUrl, permission);
  }

  /**
   * Update existing permission
   */
  updatePermission(id: number, permission: Partial<Permission>): Observable<ApiResponse<Permission>> {
    return this.http.put<ApiResponse<Permission>>(`${this.apiUrl}/${id}`, permission);
  }

  /**
   * Delete permission
   */
  deletePermission(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}

