import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to the School Management System Dashboard</p>
      <div class="stats-grid">
        <div class="card card-stats">
          <div class="card-stats-icon">
            <mat-icon>school</mat-icon>
          </div>
          <div class="card-stats-content">
            <div class="card-stats-value">1,234</div>
            <div class="card-stats-label">Total Students</div>
          </div>
        </div>
        <div class="card card-stats">
          <div class="card-stats-icon">
            <mat-icon>person</mat-icon>
          </div>
          <div class="card-stats-content">
            <div class="card-stats-value">89</div>
            <div class="card-stats-label">Total Teachers</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: var(--spacing-lg);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-lg);
      margin-top: var(--spacing-lg);
    }
  `]
})
export class DashboardComponent {}
