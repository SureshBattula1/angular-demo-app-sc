import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Section, SectionFormData } from '../../../core/models/section.model';

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private readonly ENDPOINT = '/sections';

  constructor(private apiService: ApiService) {}

  /**
   * Get all sections
   */
  getSections(params?: Record<string, unknown>): Observable<ApiResponse<Section[]>> {
    return this.apiService.get<Section[]>(this.ENDPOINT, params);
  }

  /**
   * Get section by ID
   */
  getSection(id: string | number): Observable<ApiResponse<Section>> {
    return this.apiService.get<Section>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new section
   */
  createSection(sectionData: SectionFormData): Observable<ApiResponse<Section>> {
    return this.apiService.post<Section>(this.ENDPOINT, sectionData);
  }

  /**
   * Update section
   */
  updateSection(id: string | number, sectionData: Partial<SectionFormData>): Observable<ApiResponse<Section>> {
    return this.apiService.put<Section>(`${this.ENDPOINT}/${id}`, sectionData);
  }

  /**
   * Delete section
   */
  deleteSection(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Toggle section status
   */
  toggleStatus(id: string | number): Observable<ApiResponse<Section>> {
    return this.apiService.put<Section>(`${this.ENDPOINT}/${id}/toggle-status`, {});
  }
}

