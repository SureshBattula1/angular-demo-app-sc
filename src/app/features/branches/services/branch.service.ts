import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Branch, BranchStats, BranchListResponse, BranchFormData } from '../../../core/models/branch.model';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private readonly ENDPOINT = '/branches';

  constructor(private apiService: ApiService) {}

  /**
   * Get all branches with filters
   */
  getBranches(params?: Record<string, unknown>): Observable<BranchListResponse> {
    return this.apiService.get<Branch[]>(this.ENDPOINT, params).pipe(
      map(response => ({
        success: response.success,
        data: response.data || [],
        count: response.data?.length || 0,
        total: response.data?.length || 0
      }))
    );
  }

  /**
   * Get branch by ID
   */
  getBranch(id: number): Observable<ApiResponse<Branch>> {
    return this.apiService.get<Branch>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new branch
   */
  createBranch(branchData: BranchFormData): Observable<ApiResponse<Branch>> {
    return this.apiService.post<Branch>(this.ENDPOINT, branchData);
  }

  /**
   * Update branch
   */
  updateBranch(id: number, branchData: Partial<BranchFormData>): Observable<ApiResponse<Branch>> {
    return this.apiService.put<Branch>(`${this.ENDPOINT}/${id}`, branchData);
  }

  /**
   * Delete branch (soft delete)
   */
  deleteBranch(id: number): Observable<ApiResponse<Branch>> {
    return this.apiService.delete<Branch>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Restore deleted branch
   */
  restoreBranch(id: number): Observable<ApiResponse<Branch>> {
    return this.apiService.post<Branch>(`${this.ENDPOINT}/${id}/restore`, {});
  }

  /**
   * Get deleted branches
   */
  getDeletedBranches(params?: Record<string, unknown>): Observable<BranchListResponse> {
    return this.apiService.get<Branch[]>(`${this.ENDPOINT}/deleted`, params).pipe(
      map(response => ({
        success: response.success,
        data: response.data || [],
        count: response.data?.length || 0
      }))
    );
  }

  /**
   * Bulk delete branches
   */
  bulkDelete(branchIds: number[]): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/bulk-delete`, { branch_ids: branchIds });
  }

  /**
   * Bulk restore branches
   */
  bulkRestore(branchIds: number[]): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/bulk-restore`, { branch_ids: branchIds });
  }

  /**
   * Get branch statistics
   */
  getBranchStats(id: number): Observable<ApiResponse<BranchStats>> {
    return this.apiService.get<BranchStats>(`${this.ENDPOINT}/${id}/stats`);
  }

  /**
   * Toggle branch status
   */
  toggleStatus(id: number): Observable<ApiResponse> {
    return this.apiService.put(`${this.ENDPOINT}/${id}/toggle-status`, {});
  }

  /**
   * Update branch capacity
   */
  updateCapacity(id: number, totalCapacity: number): Observable<ApiResponse> {
    return this.apiService.put(`${this.ENDPOINT}/${id}/capacity`, { total_capacity: totalCapacity });
  }

  /**
   * Get branch hierarchy
   */
  getHierarchy(id?: number): Observable<ApiResponse<Branch[]>> {
    const endpoint = id ? `${this.ENDPOINT}/hierarchy/${id}` : `${this.ENDPOINT}/hierarchy`;
    return this.apiService.get<Branch[]>(endpoint);
  }

  /**
   * Get branch locations (for map view)
   */
  getBranchLocations(): Observable<ApiResponse<Branch[]>> {
    return this.apiService.get<Branch[]>(`${this.ENDPOINT}/locations`);
  }

  /**
   * Get comparative analytics
   */
  getComparativeAnalytics(): Observable<ApiResponse> {
    return this.apiService.get(`${this.ENDPOINT}/comparative-analytics`);
  }

  /**
   * Get branch settings
   */
  getBranchSettings(id: number): Observable<ApiResponse> {
    return this.apiService.get(`${this.ENDPOINT}/${id}/settings`);
  }

  /**
   * Update branch settings
   */
  updateBranchSettings(id: number, settings: Record<string, unknown>): Observable<ApiResponse> {
    return this.apiService.post(`${this.ENDPOINT}/${id}/settings`, settings);
  }
}

