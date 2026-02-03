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
  template: `
    <div class="page-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Leave Details</h1>
      </div>

      <div class="content-card" *ngIf="leave && !isLoading">
        <!-- User Info -->
        <div class="section">
          <h2>{{ leave.leave_for === 'student' ? 'Student' : 'Teacher' }} Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Name:</span>
              <span class="value">{{ leave.first_name }} {{ leave.last_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">Email:</span>
              <span class="value">{{ leave.email }}</span>
            </div>
            <div class="info-item" *ngIf="leave.admission_number">
              <span class="label">Admission Number:</span>
              <span class="value">{{ leave.admission_number }}</span>
            </div>
            <div class="info-item" *ngIf="leave.employee_id">
              <span class="label">Employee ID:</span>
              <span class="value">{{ leave.employee_id }}</span>
            </div>
            <div class="info-item" *ngIf="leave.grade_label">
              <span class="label">Grade:</span>
              <span class="value">{{ leave.grade_label }}</span>
            </div>
            <div class="info-item" *ngIf="leave.section">
              <span class="label">Section:</span>
              <span class="value">{{ leave.section }}</span>
            </div>
            <div class="info-item" *ngIf="leave.designation">
              <span class="label">Designation:</span>
              <span class="value">{{ leave.designation }}</span>
            </div>
          </div>
        </div>

        <!-- Leave Details -->
        <div class="section">
          <h2>Leave Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Leave Type:</span>
              <span class="value">{{ leave.leave_type }}</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <mat-chip [style.background-color]="getStatusColor(leave.status)">
                {{ leave.status }}
              </mat-chip>
            </div>
            <div class="info-item">
              <span class="label">From Date:</span>
              <span class="value">{{ leave.from_date | date: 'mediumDate' }}</span>
            </div>
            <div class="info-item">
              <span class="label">To Date:</span>
              <span class="value">{{ leave.to_date | date: 'mediumDate' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Total Days:</span>
              <span class="value">{{ leave.total_days }}</span>
            </div>
          </div>
        </div>

        <!-- Reason -->
        <div class="section">
          <h2>Reason</h2>
          <p>{{ leave.reason || 'No reason provided' }}</p>
        </div>

        <!-- Remarks -->
        <div class="section" *ngIf="leave.remarks">
          <h2>Remarks</h2>
          <p>{{ leave.remarks }}</p>
        </div>

        <!-- Approval Info -->
        <div class="section" *ngIf="leave.approved_by || leave.approved_at">
          <h2>Approval Information</h2>
          <div class="info-grid">
            <div class="info-item" *ngIf="leave.approved_by">
              <span class="label">Approved By:</span>
              <span class="value">{{ leave.approved_by }}</span>
            </div>
            <div class="info-item" *ngIf="leave.approved_at">
              <span class="label">Approved At:</span>
              <span class="value">{{ leave.approved_at | date: 'medium' }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button mat-raised-button (click)="goBack()">Back</button>
          <button mat-raised-button color="primary" *ngIf="leave.status === 'Pending'" (click)="approveLeave()">
            Approve
          </button>
          <button mat-raised-button color="warn" *ngIf="leave.status === 'Pending'" (click)="rejectLeave()">
            Reject
          </button>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner></mat-spinner>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .content-card {
      background: var(--card-background);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .section {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-primary);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .value {
      font-size: 16px;
      color: var(--text-primary);
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    mat-chip {
      color: white;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 12px;
      }

      .content-card {
        padding: 16px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .actions {
        flex-direction: column;
      }

      .actions button {
        width: 100%;
      }
    }
  `]
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

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Pending': '#ff9800',
      'Approved': '#4caf50',
      'Rejected': '#f44336',
      'Cancelled': '#9e9e9e'
    };
    return colors[status] || '#9e9e9e';
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

