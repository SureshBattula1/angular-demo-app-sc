import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap, shareReplay } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { AuthService } from './auth.service';

export interface Branch {
  id: number;
  name: string;
  code: string;
  city?: string;
  is_active: boolean;
}

export interface AccessibleBranchesResponse extends ApiResponse<Branch[]> {
  user_branch_id: number;
  user_role: string;
  can_select_branch: boolean;
  has_cross_branch_access: boolean;
  can_manage_all_branches: boolean;
  can_view_all_branches: boolean;
  accessible_branch_ids: number[] | 'all';
}

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private readonly BRANCHES_KEY = 'accessible_branches';
  
  // Reactive state
  public accessibleBranches = signal<Branch[]>([]);
  public userBranchId = signal<number | null>(null);
  public canSelectBranch = signal<boolean>(false);
  public hasCrossBranchAccess = signal<boolean>(false);
  public canManageAllBranches = signal<boolean>(false);
  public canViewAllBranches = signal<boolean>(false);
  public accessibleBranchIds = signal<number[] | 'all'>([]);
  
  // Computed values
  public isBranchRestricted = computed(() => !this.canSelectBranch());
  public currentBranch = computed(() => {
    const branchId = this.userBranchId();
    return this.accessibleBranches().find(b => b.id === branchId);
  });
  
  // Cache observable to prevent multiple API calls
  private accessibleBranches$?: Observable<AccessibleBranchesResponse>;
  
  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.loadFromStorage();
  }

  /**
   * Get branches accessible to current user (cached)
   */
  getAccessibleBranches(forceRefresh = false): Observable<AccessibleBranchesResponse> {
    if (this.accessibleBranches$ && !forceRefresh) {
      return this.accessibleBranches$;
    }
    
    this.accessibleBranches$ = this.apiService.get<Branch[]>('/branches/accessible').pipe(
      tap((response: any) => {
        if (response.success) {
          this.accessibleBranches.set(response.data);
          this.userBranchId.set(response.user_branch_id);
          this.canSelectBranch.set(response.can_select_branch);
          this.hasCrossBranchAccess.set(response.has_cross_branch_access || false);
          this.canManageAllBranches.set(response.can_manage_all_branches || false);
          this.canViewAllBranches.set(response.can_view_all_branches || false);
          this.accessibleBranchIds.set(response.accessible_branch_ids);
          
          // Cache in localStorage
          this.saveToStorage(response);
        }
      }),
      shareReplay(1)
    ) as Observable<AccessibleBranchesResponse>;
    
    return this.accessibleBranches$;
  }

  /**
   * Check if user can access multiple branches
   */
  canAccessMultipleBranches(): boolean {
    const ids = this.accessibleBranchIds();
    return ids === 'all' || (Array.isArray(ids) && ids.length > 1);
  }

  /**
   * Check if branch selector should be disabled
   */
  isBranchSelectorDisabled(): boolean {
    return this.isBranchRestricted();
  }

  /**
   * Get current user's branch ID
   */
  getUserBranchId(): number | null {
    return this.userBranchId();
  }
  
  /**
   * Get default branch for forms
   */
  getDefaultBranchId(): number | null {
    // Users with cross-branch access don't have a default
    if (this.hasCrossBranchAccess()) {
      return null;
    }
    
    if (this.isBranchRestricted()) {
      return this.userBranchId();
    }
    return null;
  }
  
  /**
   * Check if user can access specific branch
   */
  canAccessBranch(branchId: number): boolean {
    const ids = this.accessibleBranchIds();
    if (ids === 'all') return true;
    return Array.isArray(ids) && ids.includes(branchId);
  }
  
  /**
   * Save to localStorage
   */
  private saveToStorage(response: any): void {
    localStorage.setItem(this.BRANCHES_KEY, JSON.stringify({
      branches: response.data,
      user_branch_id: response.user_branch_id,
      can_select_branch: response.can_select_branch,
      has_cross_branch_access: response.has_cross_branch_access,
      can_manage_all_branches: response.can_manage_all_branches,
      can_view_all_branches: response.can_view_all_branches,
      accessible_branch_ids: response.accessible_branch_ids
    }));
  }
  
  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    const cached = localStorage.getItem(this.BRANCHES_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        this.accessibleBranches.set(data.branches || []);
        this.userBranchId.set(data.user_branch_id);
        this.canSelectBranch.set(data.can_select_branch);
        this.hasCrossBranchAccess.set(data.has_cross_branch_access || false);
        this.canManageAllBranches.set(data.can_manage_all_branches || false);
        this.canViewAllBranches.set(data.can_view_all_branches || false);
        this.accessibleBranchIds.set(data.accessible_branch_ids);
      } catch (e) {
      }
    }
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    localStorage.removeItem(this.BRANCHES_KEY);
    this.accessibleBranches.set([]);
    this.userBranchId.set(null);
    this.canSelectBranch.set(false);
    this.hasCrossBranchAccess.set(false);
    this.canManageAllBranches.set(false);
    this.canViewAllBranches.set(false);
    this.accessibleBranchIds.set([]);
    this.accessibleBranches$ = undefined;
  }
}

