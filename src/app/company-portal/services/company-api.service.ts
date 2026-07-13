import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanyAuthService } from './company-auth.service';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyApiService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private companyAuthService: CompanyAuthService
  ) {
    this.baseUrl = `${environment.apiUrl}/company-portal`;
  }

  /**
   * Get request with company portal authentication
   */
  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const httpParams = this.buildParams(params);
    const headers = this.getHeaders();

    return this.http.get<ApiResponse<T>>(url, { headers, params: httpParams });
  }

  /**
   * Post request with company portal authentication
   */
  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();

    return this.http.post<ApiResponse<T>>(url, body, { headers });
  }

  /**
   * Put request with company portal authentication
   */
  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<T>>(url, body, { headers });
  }

  /**
   * Delete request with company portal authentication
   */
  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();

    return this.http.delete<ApiResponse<T>>(url, { headers });
  }

  /**
   * Patch request with company portal authentication
   */
  patch<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();

    return this.http.patch<ApiResponse<T>>(url, body, { headers });
  }

  /**
   * File upload with company portal authentication
   */
  upload<T>(endpoint: string, formData: FormData): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(true); // Don't set Content-Type for FormData

    return this.http.post<ApiResponse<T>>(url, formData, { headers });
  }

  /**
   * Get headers with authentication token
   */
  private getHeaders(skipContentType = false): HttpHeaders {
    let headers = new HttpHeaders();
    
    const token = this.companyAuthService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!skipContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    return headers;
  }

  /**
   * Build HTTP params from object
   */
  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    
    return httpParams;
  }
}

