import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { TransportDashboardSummary, TransportTrip } from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-transport-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './transport-dashboard.component.html',
  styleUrls: ['./transport-dashboard.component.scss']
})
export class TransportDashboardComponent implements OnInit {
  loading = false;
  summary: TransportDashboardSummary | null = null;

  constructor(
    private transport: TransportService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.transport.getDashboard().subscribe({
      next: (res) => {
        this.summary = res.data ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.errorHandler.showError(err);
        this.loading = false;
      }
    });
  }

  getPercent(current?: number, total?: number): number {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round(((current || 0) / total) * 100));
  }

  startTrip(trip: TransportTrip): void {
    this.transport.startTrip(trip.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess(`Trip for ${trip.route_name || 'Route'} started`);
          this.loadDashboard();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  completeTrip(trip: TransportTrip): void {
    if (!confirm(`Mark trip for "${trip.route_name || 'Route'}" as Completed?`)) return;
    this.transport.completeTrip(trip.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Trip marked as Completed');
          this.loadDashboard();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  goToBoarding(tripId: string | number): void {
    this.router.navigate(['/transport/boarding'], { queryParams: { trip_id: tripId } });
  }

  goToTracking(tripId: string | number): void {
    this.router.navigate(['/transport/tracking'], { queryParams: { trip_id: tripId } });
  }
}
