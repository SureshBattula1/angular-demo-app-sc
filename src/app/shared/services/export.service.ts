import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  columns?: string[];
  filters?: Record<string, any>;
}

export interface ExportConfig {
  endpoint: string;
  filename?: string;
}

/**
 * Reusable Export Service
 * 
 * Handles downloading data in various formats (Excel, PDF, CSV)
 * Can be used across all modules with consistent interface
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Export data with specified format and filters
   * 
   * @param config - Export configuration (endpoint, filename)
   * @param options - Export options (format, columns, filters)
   */
  export(config: ExportConfig, options: ExportOptions): void {
    const url = `${this.API_URL}${config.endpoint}`;
    
    // Build query parameters
    let params = new HttpParams();
    params = params.set('format', options.format);
    
    // Add filters to params
    if (options.filters) {
      Object.keys(options.filters).forEach(key => {
        const value = options.filters![key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    
    // Add columns if specified
    if (options.columns && options.columns.length > 0) {
      options.columns.forEach((col, index) => {
        params = params.append(`columns[${index}]`, col);
      });
    }

    // Download file
    this.downloadFile(url, params, config.filename || 'export', options.format);
  }

  /**
   * Download file using blob
   */
  private downloadFile(url: string, params: HttpParams, filename: string, format: string): void {
    this.http.get(url, {
      params,
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        if (!response.body) {
          return;
        }

        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let downloadFilename = filename;
        
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            downloadFilename = matches[1].replace(/['"]/g, '');
          }
        } else {
          // Fallback: generate filename with timestamp and extension
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const extension = this.getExtension(format);
          downloadFilename = `${filename}_${timestamp}.${extension}`;
        }

        // Create blob and download
        const blob = new Blob([response.body], { type: response.body.type });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadFilename;
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (error) => {
        
        // Try to read error message from blob
        if (error.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorObj = JSON.parse(reader.result as string);
              alert(`Export failed: ${errorObj.message || 'Unknown error'}`);
            } catch {
              alert('Export failed. Please try again.');
            }
          };
          reader.readAsText(error.error);
        } else {
          alert('Export failed. Please try again.');
        }
      }
    });
  }

  /**
   * Get file extension for format
   */
  private getExtension(format: string): string {
    return {
      'excel': 'xlsx',
      'pdf': 'pdf',
      'csv': 'csv'
    }[format] || 'xlsx';
  }
}


