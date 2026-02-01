import { Injectable, signal, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './company-api.service';

export interface CompanyAdmin {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  user_type: 'CompanyAdmin' | 'SupportStaff';
  company_id: number;
  avatar?: string;
  is_active: boolean;
  company?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface CompanyLoginCredentials {
  email: string;
  password: string;
}

export interface CompanyLoginResponse extends ApiResponse<CompanyAdmin> {
  user: CompanyAdmin;
  company: CompanyAdmin['company'];
  access_token: string;
  token_type: string;
  expires_in: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyAuthService {
  private readonly TOKEN_KEY = 'company_portal_token';
  private readonly USER_KEY = 'company_admin_user';
  
  // Signals for reactive state management
  public currentUser = signal<CompanyAdmin | null>(null);
  public isAuthenticated = signal<boolean>(false);
  
  // BehaviorSubject for compatibility
  private currentUserSubject = new BehaviorSubject<CompanyAdmin | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/company-portal`;

  constructor(
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Company Admin Login - Separate from school user login
   */
  login(credentials: CompanyLoginCredentials): Observable<CompanyLoginResponse> {
    return this.http.post<any>(`${this.baseUrl}/login`, credentials).pipe(
      map(response => {
        // Handle both ApiResponse format and direct response format
        if (response.success && response.data) {
          return {
            success: true,
            user: response.data.user || response.data,
            company: response.data.company,
            access_token: response.data.access_token || response.access_token,
            token_type: response.data.token_type || response.token_type || 'Bearer',
            expires_in: response.data.expires_in || response.expires_in
          } as CompanyLoginResponse;
        } else if (response.access_token) {
          return {
            success: true,
            user: response.user,
            company: response.company,
            access_token: response.access_token,
            token_type: response.token_type || 'Bearer',
            expires_in: response.expires_in
          } as CompanyLoginResponse;
        }
        return response as CompanyLoginResponse;
      }),
      tap(response => {
        if (response.success && response.access_token) {
          this.setSession(response);
        }
      })
    );
  }

  /**
   * Get current company admin
   */
  me(): Observable<ApiResponse<CompanyAdmin>> {
    const headers = this.getHeaders();
    return this.http.get<ApiResponse<CompanyAdmin>>(`${this.baseUrl}/auth/me`, { headers }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUser.set(response.data);
          this.currentUserSubject.next(response.data);
          this.saveUserToStorage(response.data);
        }
      })
    );
  }

  /**
   * Logout company admin
   */
  logout(): Observable<ApiResponse<void>> {
    const headers = this.getHeaders();
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/auth/logout`, {}, { headers }).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/company-portal/login']);
      })
    );
  }

  /**
   * Update company admin profile
   */
  updateProfile(data: Partial<CompanyAdmin>): Observable<ApiResponse<CompanyAdmin>> {
    const headers = this.getHeaders();
    return this.http.put<ApiResponse<CompanyAdmin>>(`${this.baseUrl}/auth/profile`, data, { headers }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUser.set(response.data);
          this.currentUserSubject.next(response.data);
          this.saveUserToStorage(response.data);
        }
      })
    );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<void>> {
    const headers = this.getHeaders();
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/auth/change-password`, {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword
    }, { headers });
  }

  /**
   * Get headers with authentication token
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Set session after login
   */
  private setSession(response: CompanyLoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    this.currentUser.set(response.user);
    this.currentUserSubject.next(response.user);
    this.isAuthenticated.set(true);
    this.saveUserToStorage(response.user);
  }

  /**
   * Clear session
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
  }

  /**
   * Get token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if authenticated
   */
  checkAuth(): boolean {
    const token = this.getToken();
    const hasUser = this.currentUser() !== null;
    const isAuth = !!token && hasUser;
    this.isAuthenticated.set(isAuth);
    return isAuth;
  }

  /**
   * Load user from storage
   */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser.set(user);
        this.currentUserSubject.next(user);
        this.isAuthenticated.set(true);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  /**
   * Save user to storage
   */
  private saveUserToStorage(user: CompanyAdmin): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}

