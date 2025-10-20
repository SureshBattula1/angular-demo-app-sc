import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ImportModule,
  ImportContext,
  ValidationResult,
  ImportPreview,
  ImportHistory,
  ImportCommitOptions,
  ImportResult
} from '../../../core/models/import.model';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private baseUrl = `${environment.apiUrl}/imports`;

  constructor(private http: HttpClient) {}

  /**
   * Get available import modules
   */
  getModules(): Observable<ImportModule[]> {
    return this.http.get<{success: boolean; data: ImportModule[]}>(`${this.baseUrl}/modules`)
      .pipe(map(response => response.data));
  }

  /**
   * Upload file for import
   */
  uploadFile(entity: string, file: File, context: ImportContext): Observable<{batch_id: string; file_name: string; file_size: number; status: string}> {
    // 🔥 Validate required fields
    if (!file) {
      throw new Error('File is required');
    }
    if (!context.branch_id) {
      throw new Error('Branch ID is required');
    }
    
    // 🔥 For student imports, grade and academic_year are required
    if (entity === 'student') {
      if (!context.grade) {
        throw new Error('Grade is required for student import');
      }
      if (!context.academic_year) {
        throw new Error('Academic year is required for student import');
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('branch_id', context.branch_id.toString());
    
    // Add optional/conditional fields
    if (context.grade) {
      formData.append('grade', context.grade);
    }
    if (context.academic_year) {
      formData.append('academic_year', context.academic_year);
    }
    if (context.section && context.section.trim() !== '') {
      formData.append('section', context.section);
    }

    // 🔥 Debug logging
    console.log('📤 Uploading with context:', {
      entity: entity,
      file: file.name,
      file_size: file.size,
      file_type: file.type,
      branch_id: context.branch_id,
      grade: context.grade || '(not applicable)',
      section: context.section || '(not selected)',
      academic_year: context.academic_year || '(not applicable)'
    });

    return this.http.post<{success: boolean; data: any}>(`${this.baseUrl}/${entity}/upload`, formData)
      .pipe(map(response => response.data));
  }

  /**
   * Validate uploaded import data
   */
  validateImport(entity: string, batchId: string): Observable<ValidationResult> {
    return this.http.post<{success: boolean; data: ValidationResult}>(`${this.baseUrl}/${entity}/validate/${batchId}`, {})
      .pipe(map(response => response.data));
  }

  /**
   * Get preview of validation results
   */
  getPreview(entity: string, batchId: string, page: number = 1, perPage: number = 25, status?: 'valid' | 'invalid' | 'all'): Observable<ImportPreview> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{success: boolean; data: any[]; summary: any; meta: any}>(
      `${this.baseUrl}/${entity}/preview/${batchId}`,
      { params }
    ).pipe(
      map(response => ({
        data: response.data,
        summary: response.summary,
        meta: response.meta
      }))
    );
  }

  /**
   * Commit import to production
   */
  commitImport(entity: string, batchId: string, options: ImportCommitOptions): Observable<ImportResult> {
    return this.http.post<{success: boolean; data: ImportResult}>(`${this.baseUrl}/${entity}/commit/${batchId}`, options)
      .pipe(map(response => response.data));
  }

  /**
   * Cancel import
   */
  cancelImport(entity: string, batchId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${entity}/cancel/${batchId}`);
  }

  /**
   * Get import history
   */
  getHistory(page: number = 1, perPage: number = 25, entityType?: string, status?: string): Observable<{data: ImportHistory[]; meta: any}> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (entityType) {
      params = params.set('entity_type', entityType);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{success: boolean; data: ImportHistory[]; meta: any}>(`${this.baseUrl}/history`, { params })
      .pipe(map(response => ({
        data: response.data,
        meta: response.meta
      })));
  }

  /**
   * Download template
   */
  downloadTemplate(entity: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/template/${entity}`, { responseType: 'blob' });
  }

  /**
   * Helper to download blob as file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

