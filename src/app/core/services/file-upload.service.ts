import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FileUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    file_path: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    extension: string;
  };
}

export interface MultipleFileUploadResponse {
  success: boolean;
  message?: string;
  data?: Array<{
    file_path: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    extension: string;
    error?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Upload single file with CLIENT-provided path
   */
  uploadFile(file: File, uploadPath: string): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_path', uploadPath);

    return this.http.post<FileUploadResponse>(`${this.API_URL}/uploads`, formData);
  }

  /**
   * Upload multiple files to same path
   */
  uploadMultipleFiles(files: File[], uploadPath: string): Observable<MultipleFileUploadResponse> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files[]', file);
    });
    formData.append('upload_path', uploadPath);

    return this.http.post<MultipleFileUploadResponse>(`${this.API_URL}/uploads/multiple`, formData);
  }

  /**
   * Delete file
   */
  deleteFile(filePath: string): Observable<{ success: boolean }> {
    return this.http.request<{ success: boolean }>(
      'DELETE',
      `${this.API_URL}/uploads`,
      { body: { file_path: filePath } }
    );
  }

  /**
   * Get file information
   */
  getFileInfo(filePath: string): Observable<any> {
    return this.http.get(`${this.API_URL}/uploads/file-info?file_path=${encodeURIComponent(filePath)}`);
  }

  /**
   * Check if file exists
   */
  checkFileExists(filePath: string): Observable<{ success: boolean; exists: boolean }> {
    return this.http.get<{ success: boolean; exists: boolean }>(
      `${this.API_URL}/uploads/exists?file_path=${encodeURIComponent(filePath)}`
    );
  }

  /**
   * Helper: Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Helper: Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Helper: Build path for teacher profile picture
   */
  buildTeacherProfilePath(extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/profiles/teacher/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build path for student profile picture
   */
  buildStudentProfilePath(extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/profiles/student/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build path for parent profile picture
   */
  buildParentProfilePath(extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/profiles/parent/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build path for admin profile picture
   */
  buildAdminProfilePath(extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/profiles/admin/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build path for branch logo
   */
  buildBranchLogoPath(extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/branches/logo/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build path for certificate
   */
  buildCertificatePath(module: string, extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/certificates/${module}/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build path for document
   */
  buildDocumentPath(module: string, extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/documents/${module}/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build path for resume
   */
  buildResumePath(module: string, extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/resumes/${module}/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build path for attachment
   */
  buildAttachmentPath(module: string, extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/attachments/${module}/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Build custom path
   */
  buildCustomPath(basePath: string, extension: string): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    return `uploads/${basePath}/${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Helper: Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 5, allowedTypes?: string[]): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'File is required' };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB` };
    }

    // Check file type
    if (allowedTypes && allowedTypes.length > 0) {
      const extension = this.getFileExtension(file.name);
      if (!allowedTypes.includes(extension)) {
        return { valid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
      }
    }

    return { valid: true };
  }
}

