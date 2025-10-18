import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HolidayService } from '../../services/holiday.service';
import { Holiday } from '../../../../core/models/holiday.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-holiday-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="holiday-view-container">
      <mat-card class="view-card">
        <div *ngIf="loading" class="loading-overlay">
          <mat-spinner diameter="50"></mat-spinner>
        </div>

        <div *ngIf="!loading && holiday">
          <mat-card-header>
            <div class="card-header-content">
              <div class="header-icon-wrapper" [style.background-color]="holiday.color || '#3498DB'">
                <mat-icon>event</mat-icon>
              </div>
              <div class="header-text">
                <h2>{{ holiday.title }}</h2>
                <mat-chip-set>
                  <mat-chip [style.background-color]="holiday.color || '#3498DB'" style="color: white;">
                    {{ holiday.type }}
                  </mat-chip>
                  <mat-chip [class.active-chip]="holiday.is_active" [class.inactive-chip]="!holiday.is_active">
                    {{ holiday.is_active ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </mat-chip-set>
              </div>
            </div>
          </mat-card-header>

          <mat-card-content class="view-content">
            <!-- Description -->
            <div class="detail-section" *ngIf="holiday.description">
              <h3><mat-icon>description</mat-icon> Description</h3>
              <p>{{ holiday.description }}</p>
            </div>

            <!-- Date Information -->
            <div class="detail-section">
              <h3><mat-icon>event</mat-icon> Date Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Start Date</label>
                  <span>{{ holiday.start_date | date: 'fullDate' }}</span>
                </div>
                <div class="info-item">
                  <label>End Date</label>
                  <span>{{ holiday.end_date | date: 'fullDate' }}</span>
                </div>
                <div class="info-item">
                  <label>Duration</label>
                  <span>{{ holiday.duration }} {{ holiday.duration === 1 ? 'day' : 'days' }}</span>
                </div>
                <div class="info-item">
                  <label>Recurring</label>
                  <span>{{ holiday.is_recurring ? 'Yes (Annual)' : 'No' }}</span>
                </div>
              </div>
            </div>

            <!-- Branch & Academic Year -->
            <div class="detail-section">
              <h3><mat-icon>school</mat-icon> Applicability</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Branch</label>
                  <span>{{ holiday.branch?.name || 'All Branches' }}</span>
                </div>
                <div class="info-item">
                  <label>Academic Year</label>
                  <span>{{ holiday.academic_year || 'Not specified' }}</span>
                </div>
              </div>
            </div>

            <!-- Created By -->
            <div class="detail-section" *ngIf="holiday.createdBy">
              <h3><mat-icon>person</mat-icon> Created By</h3>
              <p>{{ holiday.createdBy.first_name }} {{ holiday.createdBy.last_name }}</p>
              <p class="small-text">{{ holiday.created_at | date: 'medium' }}</p>
            </div>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-button (click)="onBack()">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
            <button *ngIf="canEdit()" mat-raised-button color="primary" (click)="onEdit()">
              <mat-icon>edit</mat-icon> Edit
            </button>
            <button *ngIf="canDelete()" mat-raised-button color="warn" (click)="onDelete()">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </mat-card-actions>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/assets/variables' as *;

    .holiday-view-container {
      padding: var(--spacing-lg);
      max-width: 900px;
      margin: 0 auto;
    }

    .view-card {
      box-shadow: var(--shadow-md);
      border-radius: var(--radius-lg);
    }

    .loading-overlay {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--spacing-xxl);
    }

    .card-header-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      width: 100%;
      padding: var(--spacing-md);
    }

    .header-icon-wrapper {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
    }

    .header-text {
      flex: 1;

      h2 {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      mat-chip-set {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }
    }

    .active-chip {
      background-color: var(--success-color) !important;
      color: white !important;
    }

    .inactive-chip {
      background-color: var(--warning-color) !important;
      color: white !important;
    }

    .view-content {
      padding: var(--spacing-lg);
    }

    .detail-section {
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--gray-300);

      &:last-child {
        border-bottom: none;
      }

      h3 {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin: 0 0 var(--spacing-md) 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);

        mat-icon {
          color: var(--primary-color);
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;

        &.small-text {
          font-size: 0.875rem;
          margin-top: var(--spacing-xs);
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .info-item {
      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }

      span {
        display: block;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    @media (max-width: $breakpoint-sm) {
      .holiday-view-container {
        padding: var(--spacing-sm);
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HolidayViewComponent implements OnInit {
  holiday: Holiday | null = null;
  loading = false;

  constructor(
    private holidayService: HolidayService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadHoliday(+params['id']);
      }
    });
  }

  loadHoliday(id: number): void {
    this.loading = true;
    this.holidayService.getHoliday(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.holiday = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading holiday:', error);
        this.errorHandler.showError('Failed to load holiday');
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (this.holiday) {
      this.router.navigate(['/holidays/edit', this.holiday.id]);
    }
  }

  onDelete(): void {
    if (!this.holiday) return;
    
    if (confirm(`Are you sure you want to delete "${this.holiday.title}"?`)) {
      this.holidayService.deleteHoliday(this.holiday.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Holiday deleted successfully');
            this.router.navigate(['/holidays/calendar']);
          }
        },
        error: (error) => {
          console.error('Error deleting holiday:', error);
          this.errorHandler.showError('Failed to delete holiday');
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/holidays/calendar']);
  }

  canEdit(): boolean {
    if (!this.holiday) return false;
    const user = this.authService.currentUser();
    if (user?.role === 'SuperAdmin') return true;
    if (user?.role === 'BranchAdmin') {
      return this.holiday.branch_id === user.branch_id;
    }
    return false;
  }

  canDelete(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'SuperAdmin';
  }
}

