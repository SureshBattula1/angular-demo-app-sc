import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService, DashboardStats } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {};
  recentAttendance: any[] = [];
  upcomingExams: any[] = [];
  topPerformers: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Load stats
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.error = 'Failed to load dashboard statistics. Please try again.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });

    // Load recent attendance
    this.dashboardService.getAttendance(5).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentAttendance = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
      }
    });

    // Load upcoming exams
    this.dashboardService.getUpcomingExams(5).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.upcomingExams = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading exams:', error);
      }
    });

    // Load top performers
    this.dashboardService.getTopPerformers(5).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.topPerformers = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading top performers:', error);
      }
    });
  }
}
