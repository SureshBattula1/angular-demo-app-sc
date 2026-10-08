import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

/**
 * Placeholder for future group edit by batch_uuid.
 */
@Component({
  selector: 'app-exam-schedule-group-edit',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="group-edit-placeholder">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>event_note</mat-icon>
            Edit schedule group
          </mat-card-title>
          <mat-card-subtitle>Batch: {{ batchUuid || '—' }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Group edit will be available in a future update. For now, edit each subject schedule individually from the list.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-raised-button color="primary" type="button" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to schedules
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .group-edit-placeholder {
      padding: var(--spacing-lg);
      max-width: 640px;
      margin: 0 auto;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--text-primary);
      font-size: 1.25rem;
    }
    mat-card-content p {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.5;
    }
  `]
})
export class ExamScheduleGroupEditComponent {
  batchUuid?: string;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.route.params.subscribe(params => {
      this.batchUuid = params['batchUuid'];
    });
  }

  goBack(): void {
    this.router.navigate(['/exams'], { queryParams: { tab: 'schedules' } });
  }
}
