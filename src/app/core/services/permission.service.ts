import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Permission {
  id: number;
  module_id: number;
  name: string;
  slug: string;
  action: string;
  module?: Module;
}

export interface Module {
  id: number;
  name: string;
  slug: string;
  icon: string;
  route: string;
  order: number;
  permissions?: Permission[];
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  level: number;
  permissions?: Permission[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly PERMISSIONS_KEY = 'user_permissions';
  private readonly MODULES_KEY = 'user_modules';

  // Signals for reactive state management
  public userPermissions = signal<string[]>([]);
  public availableModules = signal<Module[]>([]);
  
  // BehaviorSubject for backward compatibility
  private permissionsSubject = new BehaviorSubject<string[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadPermissionsFromStorage();
  }

  /**
   * Load user permissions from API
   */
  loadUserPermissions(userId: number): Observable<ApiResponse> {
    return this.apiService.get(`/permissions/user/${userId}/permissions`).pipe(
      tap(response => {
        if (response.success && response.data) {
          const data = response.data as any;
          const permissions = data.permission_slugs || 
                            this.extractPermissionSlugs(data.permissions);
          this.setPermissions(permissions);
        }
      })
    );
  }

  /**
   * Load available modules
   */
  loadModules(): Observable<ApiResponse<Module[]>> {
    return this.apiService.get<Module[]>('/permissions/modules').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setModules(response.data);
        }
      })
    );
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const permissions = this.userPermissions();
    return permissions.includes(permission) || this.isSuperAdmin();
  }

  /**
   * Check if user has any of the given permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Check if user has all given permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Check if current user is super admin
   */
  private isSuperAdmin(): boolean {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role === 'SuperAdmin';
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Get accessible modules for current user
   */
  getAccessibleModules(): Module[] {
    const modules = this.availableModules();
    
    if (this.isSuperAdmin()) {
      return modules;
    }

    return modules.filter(module => {
      // Check if user has at least one permission for this module
      const modulePermissions = module.permissions || [];
      return modulePermissions.some(perm => this.hasPermission(perm.slug));
    });
  }

  /**
   * Get permissions for a specific module
   */
  getModulePermissions(moduleSlug: string): string[] {
    const permissions = this.userPermissions();
    return permissions.filter(p => p.startsWith(`${moduleSlug}.`));
  }

  /**
   * Check if user can perform action on module
   */
  canPerformAction(moduleSlug: string, action: string): boolean {
    return this.hasPermission(`${moduleSlug}.${action}`);
  }

  /**
   * Set user permissions
   */
  private setPermissions(permissions: string[]): void {
    this.userPermissions.set(permissions);
    this.permissionsSubject.next(permissions);
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
  }

  /**
   * Set available modules
   */
  private setModules(modules: Module[]): void {
    this.availableModules.set(modules);
    localStorage.setItem(this.MODULES_KEY, JSON.stringify(modules));
  }

  /**
   * Clear permissions (on logout)
   */
  clearPermissions(): void {
    this.userPermissions.set([]);
    this.availableModules.set([]);
    this.permissionsSubject.next([]);
    localStorage.removeItem(this.PERMISSIONS_KEY);
    localStorage.removeItem(this.MODULES_KEY);
  }

  /**
   * Load permissions from localStorage
   */
  private loadPermissionsFromStorage(): void {
    const permStr = localStorage.getItem(this.PERMISSIONS_KEY);
    const modulesStr = localStorage.getItem(this.MODULES_KEY);
    
    if (permStr) {
      try {
        const permissions = JSON.parse(permStr);
        this.userPermissions.set(permissions);
        this.permissionsSubject.next(permissions);
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem(this.PERMISSIONS_KEY);
      }
    }
    
    if (modulesStr) {
      try {
        this.availableModules.set(JSON.parse(modulesStr));
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem(this.MODULES_KEY);
      }
    }
  }

  /**
   * Extract permission slugs from API response
   */
  private extractPermissionSlugs(permissionsData: any): string[] {
    const slugs: string[] = [];
    
    if (Array.isArray(permissionsData)) {
      permissionsData.forEach(perm => {
        if (perm.slug) slugs.push(perm.slug);
      });
    } else if (typeof permissionsData === 'object') {
      // Grouped by module
      Object.values(permissionsData).forEach((perms: any) => {
        if (Array.isArray(perms)) {
          perms.forEach(perm => {
            if (perm.slug) slugs.push(perm.slug);
          });
        }
      });
    }
    
    return slugs;
  }

  /**
   * Refresh permissions from server
   */
  refreshPermissions(userId: number): Observable<ApiResponse> {
    return this.loadUserPermissions(userId);
  }
}

