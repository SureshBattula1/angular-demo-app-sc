import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import {
  TransportTrip,
  TransportRoute,
  Vehicle,
  TransportDriver
} from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.scss']
})
export class TripListComponent implements OnInit {
  loading = false;
  activeTabIndex = 0;
  searchQuery = '';

  todayTrips: TransportTrip[] = [];
  upcomingTrips: TransportTrip[] = [];
  historyTrips: TransportTrip[] = [];
  displayedTrips: TransportTrip[] = [];

  routes: TransportRoute[] = [];
  vehicles: Vehicle[] = [];
  drivers: TransportDriver[] = [];

  get inTransitCount(): number {
    return this.todayTrips.filter(t => t.status === 'Started' || t.status === 'In Progress').length;
  }
  get scheduledCount(): number {
    return this.todayTrips.filter(t => t.status === 'Scheduled').length;
  }
  get completedCount(): number {
    return this.todayTrips.filter(t => t.status === 'Completed').length;
  }

  scheduleModalVisible = false;
  savingTrip = false;
  newTrip: Partial<TransportTrip> = {
    route_id: '',
    trip_type: 'Pickup',
    trip_date: null,
    vehicle_id: null,
    transport_driver_id: null,
    scheduled_start_time: '07:30'
  };

  changeDriverModalVisible = false;
  targetTripForChange: TransportTrip | null = null;
  selectedNewDriverId: string | number | null = null;

  changeVehicleModalVisible = false;
  selectedNewVehicleId: string | number | null = null;

  constructor(
    private transport: TransportService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadMetadata();
    this.loadTrips();
  }

  loadMetadata(): void {
    this.transport.getRoutes({ per_page: 100 }).subscribe({ next: (r) => (this.routes = r.data || []) });
    this.transport.getVehicles({ per_page: 100 }).subscribe({ next: (v) => (this.vehicles = v.data || []) });
    this.transport.getDrivers({ per_page: 100 }).subscribe({ next: (d) => (this.drivers = d.data || []) });
  }

  loadTrips(): void {
    this.loading = true;
    const todayStr = new Date().toISOString().substring(0, 10);

    this.transport.getTrips({ per_page: 200 }).subscribe({
      next: (res) => {
        const all = res.data || [];
        // Daily recurring trips (trip_date is null/empty) or trips specifically for today
        this.todayTrips = all.filter((t) => !t.trip_date || t.trip_date === todayStr);
        this.upcomingTrips = all.filter((t) => !!t.trip_date && t.trip_date > todayStr);
        this.historyTrips = all.filter((t) => (!!t.trip_date && t.trip_date < todayStr) || (t.trip_date && t.status === 'Completed'));
        this.filterActiveTrips();
        this.loading = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loading = false;
      }
    });
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    this.filterActiveTrips();
  }

  filterActiveTrips(): void {
    let source: TransportTrip[] = [];
    if (this.activeTabIndex === 0) source = this.todayTrips;
    else if (this.activeTabIndex === 1) source = this.upcomingTrips;
    else source = this.historyTrips;

    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.displayedTrips = [...source];
      return;
    }
    this.displayedTrips = source.filter((t) =>
      (t.route_name && t.route_name.toLowerCase().includes(q)) ||
      (t.vehicle_number && t.vehicle_number.toLowerCase().includes(q)) ||
      (t.driver_name && t.driver_name.toLowerCase().includes(q))
    );
  }

  openScheduleModal(): void {
    this.newTrip = {
      route_id: this.routes[0]?.id || '',
      trip_type: 'Pickup',
      trip_date: null,
      vehicle_id: this.vehicles[0]?.id || null,
      transport_driver_id: this.drivers[0]?.id || null,
      scheduled_start_time: '07:30'
    };
    this.scheduleModalVisible = true;
  }

  saveScheduleTrip(): void {
    if (!this.newTrip.route_id) return;
    this.savingTrip = true;
    const payload = {
      ...this.newTrip,
      trip_date: this.newTrip.trip_date || null
    };
    this.transport.createTrip(payload).subscribe({
      next: (res) => {
        this.savingTrip = false;
        if (res.success) {
          this.errorHandler.showSuccess('Daily trip scheduled successfully');
          this.scheduleModalVisible = false;
          this.loadTrips();
        } else {
          this.errorHandler.showError(res.message || 'Failed');
        }
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.savingTrip = false;
      }
    });
  }

  startTrip(t: TransportTrip): void {
    this.transport.startTrip(t.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Trip started');
          this.loadTrips();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  completeTrip(t: TransportTrip): void {
    if (!confirm('Mark trip as completed?')) return;
    this.transport.completeTrip(t.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Trip completed');
          this.loadTrips();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  openChangeDriverModal(t: TransportTrip): void {
    this.targetTripForChange = t;
    this.selectedNewDriverId = t.transport_driver_id || null;
    this.changeDriverModalVisible = true;
  }

  confirmChangeDriver(): void {
    if (!this.targetTripForChange || !this.selectedNewDriverId) return;
    this.transport.changeTripDriver(this.targetTripForChange.id, this.selectedNewDriverId).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Trip driver updated');
          this.changeDriverModalVisible = false;
          this.loadTrips();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  openChangeVehicleModal(t: TransportTrip): void {
    this.targetTripForChange = t;
    this.selectedNewVehicleId = t.vehicle_id || null;
    this.changeVehicleModalVisible = true;
  }

  confirmChangeVehicle(): void {
    if (!this.targetTripForChange || !this.selectedNewVehicleId) return;
    this.transport.changeTripVehicle(this.targetTripForChange.id, this.selectedNewVehicleId).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Trip vehicle updated');
          this.changeVehicleModalVisible = false;
          this.loadTrips();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  deleteTrip(t: TransportTrip): void {
    if (!confirm(`Delete trip for "${t.route_name || 'Route'}" on ${t.trip_date}?`)) return;
    this.transport.deleteTrip(t.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Trip deleted');
          this.loadTrips();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
