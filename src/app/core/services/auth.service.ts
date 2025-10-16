import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, of, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'SuperAdmin' | 'BranchAdmin' | 'Teacher' | 'Student' | 'Parent' | 'Staff';
  branch_id?: number;
  branch?: unknown;
  avatar?: string;
  is_active: boolean;
  last_login?: string;
  full_name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse extends ApiResponse<User> {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role: string;
  branch_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  
  // Signals for reactive state management
  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);
  
  // BehaviorSubject for compatibility
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Login user
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.apiService.post<User>('/login', credentials).pipe(
      map(response => response as unknown as LoginResponse),
      tap(response => {
        if (response.success && response.access_token) {
          this.setSession(response);
        }
      })
    );
  }

  /**
   * Register new user
   */
  register(data: RegisterData): Observable<LoginResponse> {
    return this.apiService.post<User>('/register', data).pipe(
      map(response => response as unknown as LoginResponse),
      tap(response => {
        if (response.success && response.access_token) {
          this.setSession(response);
        }
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<ApiResponse> {
    return this.apiService.post('/logout', {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        // Clear session even if API call fails
        this.clearSession();
        return of({ success: true, message: 'Logged out' });
      })
    );
  }

  /**
   * Get current user from API
   */
  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.apiService.get<User>('/me').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateCurrentUser(response.data);
        }
      })
    );
  }

  /**
   * Forgot password
   */
  forgotPassword(email: string): Observable<ApiResponse> {
    return this.apiService.post('/forgot-password', { email });
  }

  /**
   * Reset password
   */
  resetPassword(token: string, password: string, password_confirmation: string): Observable<ApiResponse> {
    return this.apiService.post('/reset-password', { token, password, password_confirmation });
  }

  /**
   * Update user profile
   */
  updateProfile(data: Partial<User>): Observable<ApiResponse<User>> {
    return this.apiService.put<User>('/profile', data).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.updateCurrentUser(response.user);
        }
      })
    );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, password: string, password_confirmation: string): Observable<ApiResponse> {
    return this.apiService.put('/change-password', {
      current_password: currentPassword,
      password,
      password_confirmation
    });
  }

  /**
   * Set authentication session
   */
  private setSession(response: LoginResponse): void {
    if (response.access_token) {
      localStorage.setItem(this.TOKEN_KEY, response.access_token);
    }
    
    if (response.user) {
      const user = response.user;
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.updateCurrentUser(user);
    }
    
    this.isAuthenticated.set(true);
  }

  /**
   * Clear authentication session
   */
  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Load user from local storage
   */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.updateCurrentUser(user);
        this.isAuthenticated.set(true);
      } catch {
        this.clearSession();
      }
    }
  }

  /**
   * Update current user
   */
  private updateCurrentUser(user: User): void {
    this.currentUser.set(user);
    this.currentUserSubject.next(user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Check user role
   */
  hasRole(role: string | string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole(['SuperAdmin', 'BranchAdmin']);
  }

  /**
   * Get user full name
   */
  getUserFullName(): string {
    const user = this.currentUser();
    return user ? `${user.first_name} ${user.last_name}` : '';
  }
}

