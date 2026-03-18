import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  user?: T;
  access_token?: string;
  token_type?: string;
  expires_in?: string;
  errors?: Record<string, string[]>;
  error?: string;
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    has_more_pages?: boolean;
  };
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Build the full URL by properly joining the base URL and endpoint
   */
  private buildUrl(endpoint: string): string {
    const base = this.API_URL.endsWith('/') ? this.API_URL.slice(0, -1) : this.API_URL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: Record<string, unknown>): Observable<ApiResponse<T>> {
    const httpParams = this.buildParams(params);
    return this.http.get<ApiResponse<T>>(this.buildUrl(endpoint), { 
      params: httpParams,
      withCredentials: true 
    });
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: unknown, options?: { headers?: Record<string, string> }): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.buildUrl(endpoint), body, {
      ...options,
      withCredentials: true
    });
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: unknown, params?: Record<string, unknown>): Observable<ApiResponse<T>> {
    const httpParams = this.buildParams(params);
    return this.http.put<ApiResponse<T>>(this.buildUrl(endpoint), body, {
      params: httpParams,
      withCredentials: true
    });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, params?: Record<string, unknown>): Observable<ApiResponse<T>> {
    const httpParams = this.buildParams(params);
    return this.http.delete<ApiResponse<T>>(this.buildUrl(endpoint), {
      params: httpParams,
      withCredentials: true
    });
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.buildUrl(endpoint), body, {
      withCredentials: true
    });
  }

  /**
   * Upload file
   */
  upload<T>(endpoint: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.buildUrl(endpoint), formData, {
      withCredentials: true,
      headers: {
        // Let browser set Content-Type for FormData (includes boundary)
      }
    });
  }

  /**
   * Build HTTP params from object
   */
  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }
}

