import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface BranchTransfer {
  id: number;
  student_id: number;
  from_branch_id: number;
  to_branch_id: number;
  transfer_date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  approved_by?: number;
  approved_at?: string;
  completed_at?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  student?: any;
  fromBranch?: any;
  toBranch?: any;
  approver?: any;
}

export interface BranchTransferStatistics {
  total_transfers: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
}

@Injectable({
  providedIn: 'root'
})
export class BranchTransferService {
  private readonly ENDPOINT = '/branch-transfers';

  constructor(private apiService: ApiService) {}

  /**
   * Get all branch transfers
   */
  getTransfers(params?: Record<string, unknown>): Observable<ApiResponse<BranchTransfer[]>> {
    return this.apiService.get<BranchTransfer[]>(this.ENDPOINT, params);
  }

  /**
   * Get transfer statistics
   */
  getStatistics(params?: Record<string, unknown>): Observable<ApiResponse<BranchTransferStatistics>> {
    return this.apiService.get<BranchTransferStatistics>(`${this.ENDPOINT}/statistics`, params);
  }

  /**
   * Get transfer by ID
   */
  getTransfer(id: number): Observable<ApiResponse<BranchTransfer>> {
    return this.apiService.get<BranchTransfer>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new transfer request
   */
  createTransfer(transferData: Partial<BranchTransfer>): Observable<ApiResponse<BranchTransfer>> {
    return this.apiService.post<BranchTransfer>(this.ENDPOINT, transferData);
  }

  /**
   * Approve transfer
   */
  approveTransfer(id: number, remarks?: string): Observable<ApiResponse<BranchTransfer>> {
    return this.apiService.post<BranchTransfer>(`${this.ENDPOINT}/${id}/approve`, { remarks });
  }

  /**
   * Reject transfer
   */
  rejectTransfer(id: number, remarks?: string): Observable<ApiResponse<BranchTransfer>> {
    return this.apiService.post<BranchTransfer>(`${this.ENDPOINT}/${id}/reject`, { remarks });
  }

  /**
   * Complete transfer
   */
  completeTransfer(id: number, remarks?: string): Observable<ApiResponse<BranchTransfer>> {
    return this.apiService.post<BranchTransfer>(`${this.ENDPOINT}/${id}/complete`, { remarks });
  }

  /**
   * Cancel transfer
   */
  cancelTransfer(id: number, remarks?: string): Observable<ApiResponse<BranchTransfer>> {
    return this.apiService.post<BranchTransfer>(`${this.ENDPOINT}/${id}/cancel`, { remarks });
  }
}

