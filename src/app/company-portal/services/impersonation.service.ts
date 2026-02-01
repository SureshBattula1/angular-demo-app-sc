import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CompanyApiService, ApiResponse } from './company-api.service';

export interface ImpersonationSession {
  id: number;
  company_admin_id: number;
  impersonated_user_id: number;
  token: string;
  ip_address?: string;
  user_agent?: string;
  started_at: string;
  ended_at?: string;
  reason?: string;
  actions_log?: Array<{
    action: string;
    details: any;
    timestamp: string;
  }>;
  status: 'Active' | 'Ended' | 'Expired';
  impersonated_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ImpersonationService {
  // Reactive state
  public activeSession = signal<ImpersonationSession | null>(null);
  public sessions = signal<ImpersonationSession[]>([]);

  constructor(
    private companyApiService: CompanyApiService
  ) {}

  /**
   * Start impersonation session
   */
  startImpersonation(userId: number, reason?: string): Observable<ApiResponse<any>> {
    return this.companyApiService.post<any>(`/impersonate/${userId}`, { reason }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.activeSession.set(response.data.session);
        }
      })
    );
  }

  /**
   * Stop impersonation session
   */
  stopImpersonation(): Observable<ApiResponse<void>> {
    return this.companyApiService.post<void>('/impersonate/stop', {}).pipe(
      tap(response => {
        if (response.success) {
          this.activeSession.set(null);
        }
      })
    );
  }

  /**
   * Get active impersonation sessions
   */
  getActiveSessions(): Observable<ApiResponse<ImpersonationSession[]>> {
    return this.companyApiService.get<ImpersonationSession[]>('/impersonate/sessions/active').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.sessions.set(response.data);
          // Set first active session as current
          const active = response.data.find(s => s.status === 'Active');
          this.activeSession.set(active || null);
        }
      })
    );
  }

  /**
   * Get impersonation session history
   */
  getSessionHistory(params?: any): Observable<ApiResponse<ImpersonationSession[]>> {
    return this.companyApiService.get<ImpersonationSession[]>('/impersonate/sessions/history', params).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.sessions.set(response.data);
        }
      })
    );
  }

  /**
   * Log action during impersonation
   */
  logAction(action: string, details?: any): Observable<ApiResponse<void>> {
    return this.companyApiService.post<void>('/impersonate/log-action', {
      action,
      details
    });
  }

  /**
   * Check if currently impersonating
   */
  isImpersonating(): boolean {
    return this.activeSession() !== null && this.activeSession()?.status === 'Active';
  }

  /**
   * Check if impersonation token exists in storage
   */
  hasImpersonationToken(): boolean {
    return !!localStorage.getItem('impersonation_token');
  }

  /**
   * Exit impersonation and restore company portal session
   */
  exitImpersonation(): Observable<ApiResponse<void>> {
    return this.stopImpersonation().pipe(
      tap(() => {
        // Restore company portal token
        const companyPortalToken = localStorage.getItem('company_portal_token_backup');
        if (companyPortalToken) {
          localStorage.setItem('company_portal_token', companyPortalToken);
          localStorage.removeItem('company_portal_token_backup');
        }
        
        // Clear impersonation token
        localStorage.removeItem('impersonation_token');
        localStorage.removeItem('auth_token');
        
        // Clear active session
        this.activeSession.set(null);
      })
    );
  }
}

