import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Subject, SubjectFormData } from '../../../core/models/subject.model';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private readonly ENDPOINT = '/subjects';

  constructor(private apiService: ApiService) {}

  getSubjects(params?: Record<string, unknown>): Observable<ApiResponse<Subject[]>> {
    return this.apiService.get<Subject[]>(this.ENDPOINT, params);
  }

  getSubject(id: number): Observable<ApiResponse<Subject>> {
    return this.apiService.get<Subject>(`${this.ENDPOINT}/${id}`);
  }

  createSubject(subjectData: SubjectFormData): Observable<ApiResponse<Subject>> {
    return this.apiService.post<Subject>(this.ENDPOINT, subjectData);
  }

  updateSubject(id: number, subjectData: Partial<SubjectFormData>): Observable<ApiResponse<Subject>> {
    return this.apiService.put<Subject>(`${this.ENDPOINT}/${id}`, subjectData);
  }

  deleteSubject(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }
}

