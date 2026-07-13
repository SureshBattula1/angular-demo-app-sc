import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap, shareReplay } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface School {
  id: number;
  company_id: number;
  name: string;
  code: string;
  main_branch_id?: number;
  status: 'Active' | 'Inactive' | 'Suspended' | 'UnderConstruction';
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  branches_count?: number;
  active_branches_count?: number;
  company?: {
    id: number;
    name: string;
    code: string;
  };
  main_branch?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface SchoolsResponse extends ApiResponse<School[]> {
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SchoolService {
  private readonly SCHOOLS_KEY = 'accessible_schools';
  private readonly CURRENT_SCHOOL_KEY = 'current_school_id';
  
  // Reactive state
  public accessibleSchools = signal<School[]>([]);
  public currentSchoolId = signal<number | null>(null);
  public currentSchool = signal<School | null>(null);
  
  // Computed values
  public hasMultipleSchools = computed(() => this.accessibleSchools().length > 1);
  public isSchoolSelected = computed(() => this.currentSchoolId() !== null);
  
  // Cache observable
  private accessibleSchools$?: Observable<SchoolsResponse>;
  
  constructor(
    private apiService: ApiService
  ) {
    this.loadFromStorage();
  }

  /**
   * Get schools accessible to current user
   */
  getAccessibleSchools(forceRefresh = false): Observable<SchoolsResponse> {
    if (this.accessibleSchools$ && !forceRefresh) {
      return this.accessibleSchools$;
    }
    
    this.accessibleSchools$ = this.apiService.get<School[]>('/schools').pipe(
      tap((response: any) => {
        if (response.success) {
          this.accessibleSchools.set(response.data);
          
          // Auto-select school if only one available
          if (response.data.length === 1) {
            this.setCurrentSchool(response.data[0].id);
          }
          
          this.saveToStorage(response);
        }
      }),
      shareReplay(1)
    ) as Observable<SchoolsResponse>;
    
    return this.accessibleSchools$;
  }

  /**
   * Set current school
   */
  setCurrentSchool(schoolId: number): void {
    this.currentSchoolId.set(schoolId);
    const school = this.accessibleSchools().find(s => s.id === schoolId);
    this.currentSchool.set(school || null);
    localStorage.setItem(this.CURRENT_SCHOOL_KEY, schoolId.toString());
  }

  /**
   * Get current school
   */
  getCurrentSchool(): School | null {
    return this.currentSchool();
  }

  /**
   * Get current school ID
   */
  getCurrentSchoolId(): number | null {
    return this.currentSchoolId();
  }

  /**
   * Clear current school selection
   */
  clearCurrentSchool(): void {
    this.currentSchoolId.set(null);
    this.currentSchool.set(null);
    localStorage.removeItem(this.CURRENT_SCHOOL_KEY);
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(response: any): void {
    localStorage.setItem(this.SCHOOLS_KEY, JSON.stringify({
      schools: response.data
    }));
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    const cached = localStorage.getItem(this.SCHOOLS_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        this.accessibleSchools.set(data.schools || []);
      } catch (e) {
        // Ignore parse errors
      }
    }

    const currentSchoolId = localStorage.getItem(this.CURRENT_SCHOOL_KEY);
    if (currentSchoolId) {
      const schoolId = parseInt(currentSchoolId, 10);
      this.currentSchoolId.set(schoolId);
      const school = this.accessibleSchools().find(s => s.id === schoolId);
      this.currentSchool.set(school || null);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    localStorage.removeItem(this.SCHOOLS_KEY);
    localStorage.removeItem(this.CURRENT_SCHOOL_KEY);
    this.accessibleSchools.set([]);
    this.currentSchoolId.set(null);
    this.currentSchool.set(null);
    this.accessibleSchools$ = undefined;
  }
}

