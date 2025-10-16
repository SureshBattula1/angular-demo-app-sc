import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { StudentGroup, GroupFormData, GroupListResponse } from '../../../core/models/class-section.model';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly ENDPOINT = '/student-groups';

  constructor(private apiService: ApiService) {}

  /**
   * Get all student groups
   */
  getGroups(params?: Record<string, unknown>): Observable<GroupListResponse> {
    return this.apiService.get<StudentGroup[]>(this.ENDPOINT, params).pipe(
      map(response => ({
        success: response.success,
        data: response.data || [],
        count: response.data?.length || 0
      }))
    );
  }

  /**
   * Get group by ID
   */
  getGroup(id: number): Observable<ApiResponse<StudentGroup>> {
    return this.apiService.get<StudentGroup>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new group
   */
  createGroup(groupData: GroupFormData): Observable<ApiResponse<StudentGroup>> {
    return this.apiService.post<StudentGroup>(this.ENDPOINT, groupData);
  }

  /**
   * Update group
   */
  updateGroup(id: number, groupData: Partial<GroupFormData>): Observable<ApiResponse<StudentGroup>> {
    return this.apiService.put<StudentGroup>(`${this.ENDPOINT}/${id}`, groupData);
  }

  /**
   * Delete group
   */
  deleteGroup(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Add member to group
   */
  addMember(groupId: number, studentId: number, role: string = 'Member'): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/${groupId}/add-member`, {
      student_id: studentId,
      role,
      joined_date: new Date().toISOString().split('T')[0]
    });
  }

  /**
   * Remove member from group
   */
  removeMember(groupId: number, studentId: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${groupId}/members/${studentId}`);
  }
}

