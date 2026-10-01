import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import {
  Assignment,
  CreateAssignmentPayload,
  EligibleStudent,
  AssignmentRecipientPreview,
  UpdateAssignmentPayload
} from '../../../core/models/assignment.model';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly ENDPOINT = '/assignments';

  constructor(private apiService: ApiService) {}

  getAssignments(params?: Record<string, unknown>): Observable<ApiResponse<Assignment[]>> {
    return this.apiService.get<Assignment[]>(this.ENDPOINT, params);
  }

  getAssignment(id: string | number): Observable<ApiResponse<Assignment>> {
    return this.apiService.get<Assignment>(`${this.ENDPOINT}/${id}`);
  }

  createAssignment(data: CreateAssignmentPayload): Observable<ApiResponse<Assignment>> {
    return this.apiService.post<Assignment>(this.ENDPOINT, data);
  }

  updateAssignment(
    id: string | number,
    data: UpdateAssignmentPayload
  ): Observable<ApiResponse<Assignment>> {
    return this.apiService.put<Assignment>(`${this.ENDPOINT}/${id}`, data);
  }

  deleteAssignment(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  getEligibleStudents(params: {
    grade: string;
    section?: string | null;
    branch_id?: string | number | null;
  }): Observable<ApiResponse<EligibleStudent[]>> {
    return this.apiService.get<EligibleStudent[]>(`${this.ENDPOINT}/eligible-students`, params);
  }

  previewRecipients(body: {
    grade: string;
    section?: string | null;
    audience_mode: 'all' | 'custom';
    student_ids?: (string | number)[];
    branch_id?: string | number | null;
  }): Observable<ApiResponse<AssignmentRecipientPreview>> {
    return this.apiService.post<AssignmentRecipientPreview>(
      `${this.ENDPOINT}/preview-recipients`,
      body
    );
  }
}
