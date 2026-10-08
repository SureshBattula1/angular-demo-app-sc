import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import {
  Assignment,
  CreateAssignmentPayload,
  EligibleStudent,
  AssignmentRecipientPreview,
  MyAssignmentSubmission,
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

  submitMyAssignment(
    id: string | number,
    submissionText?: string | null
  ): Observable<ApiResponse<{ my_submission: MyAssignmentSubmission }>> {
    const body: { submission_text?: string } = {};
    if (submissionText != null && submissionText.trim() !== '') {
      body.submission_text = submissionText.trim();
    }
    return this.apiService.post(`${this.ENDPOINT}/${id}/my-submission`, body);
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
