import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { LeaveService } from '../../services/leave.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Leave } from '../../../../core/models/leave.model';

@Component({
  selector: 'app-leave-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './leave-view.component.html',
  styleUrls: ['./leave-view.component.scss']
})
export class LeaveViewComponent implements OnInit {
  leave?: Leave;
  isLoading = true;
  leaveId!: number;

  constructor(
    private leaveService: LeaveService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.leaveId = +params['id'];
        // Get type from query params
        const snapshot = this.route.snapshot.queryParams;
        const type = snapshot['type'] === 'teacher' ? 'teacher' : 'student';
        this.loadLeave(type);
      }
    });
  }

  loadLeave(type: 'student' | 'teacher' = 'student'): void {
    this.isLoading = true;
    this.leaveService.getLeave(this.leaveId, type).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.leave = Array.isArray(response.data) ? response.data[0] : response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/leaves']);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'status-pending',
      'Approved': 'status-approved',
      'Rejected': 'status-rejected',
      'Cancelled': 'status-cancelled'
    };
    return map[status] || 'status-pending';
  }

  approveLeave(): void {
    if (!this.leave) return;
    
    if (confirm('Are you sure you want to approve this leave?')) {
      const type = this.leave.leave_for || 'student';
      this.leaveService.approveLeave(this.leave.id, type).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Leave approved successfully');
            this.loadLeave();
          }
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }

  rejectLeave(): void {
    if (!this.leave) return;
    
    if (confirm('Are you sure you want to reject this leave?')) {
      const type = this.leave.leave_for || 'student';
      this.leaveService.rejectLeave(this.leave.id, type).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Leave rejected successfully');
            this.loadLeave();
          }
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/leaves']);
  }
}

