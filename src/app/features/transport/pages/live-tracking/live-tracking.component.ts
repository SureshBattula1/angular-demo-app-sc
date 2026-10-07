import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { TransportTrip } from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-live-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './live-tracking.component.html',
  styleUrls: ['./live-tracking.component.scss']
})
export class LiveTrackingComponent implements OnInit, OnDestroy {
  loading = false;
  availableTrips: TransportTrip[] = [];
  selectedTripId: string | number | null = null;
  trackingData: any = null;
  private pollInterval: any = null;

  busX = 360;
  busY = 100;

  constructor(
    private transport: TransportService,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadAvailableTrips();
    this.pollInterval = setInterval(() => {
      if (this.selectedTripId && !this.loading) {
        this.pollLiveTracking();
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  get busTransform(): string {
    return `translate(${this.busX}, ${this.busY})`;
  }

  loadAvailableTrips(): void {
    this.transport.getTrips({ per_page: 50, active_only: true }).subscribe({
      next: (res) => {
        const todayStr = new Date().toISOString().substring(0, 10);
        this.availableTrips = (res.data || []).filter((t) => {
          const isActive = t.status !== 'Completed' && t.status !== 'Cancelled';
          const isTodayOrFuture = !t.trip_date || t.trip_date >= todayStr;
          return isActive && isTodayOrFuture;
        });

        this.route.queryParams.subscribe((params) => {
          if (params['trip_id'] && this.availableTrips.some(t => t.id == params['trip_id'])) {
            this.selectedTripId = params['trip_id'];
          } else if (this.availableTrips.length > 0) {
            this.selectedTripId = this.availableTrips[0].id;
          } else {
            this.selectedTripId = null;
          }
          if (this.selectedTripId) {
            this.pollLiveTracking();
          }
        });
      },
      error: () => {}
    });
  }

  onTripSelected(tripId: string | number): void {
    this.selectedTripId = tripId;
    this.pollLiveTracking();
  }

  pollLiveTracking(): void {
    if (!this.selectedTripId) return;
    this.loading = true;
    this.transport.getLiveTracking(this.selectedTripId).subscribe({
      next: (res) => {
        this.trackingData = res.data;
        if (this.trackingData?.telemetry?.speed > 0) {
          this.busX = (this.busX + 30) % 650;
          if (this.busX < 120) this.busX = 160;
        }
        this.loading = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loading = false;
      }
    });
  }

  simulateGpsPing(): void {
    if (!this.selectedTripId) return;
    const mockLat = 12.9716 + (Math.random() - 0.5) * 0.01;
    const mockLng = 77.5946 + (Math.random() - 0.5) * 0.01;
    const mockSpeed = Math.floor(Math.random() * 45) + 15;

    this.transport.updateTripGps(this.selectedTripId, {
      latitude: mockLat,
      longitude: mockLng,
      speed: mockSpeed
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess(`Driver GPS Telemetry Ping: ${mockSpeed} km/h`);
          this.pollLiveTracking();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
