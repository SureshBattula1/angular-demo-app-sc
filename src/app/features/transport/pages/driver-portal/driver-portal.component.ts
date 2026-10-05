import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import {
  DriverDashboardData,
  DriverAttendanceLog,
  TransportTrip,
  TripBoardingLog,
  RouteStop,
  Vehicle,
  TransportRoute
} from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';

type DriverPortalTab = 'bus-route' | 'trip-roster' | 'attendance';
type StudentFilter = 'ALL' | 'Pending' | 'Boarded' | 'Dropped';

@Component({
  selector: 'app-driver-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './driver-portal.component.html',
  styleUrls: ['./driver-portal.component.scss']
})
export class DriverPortalComponent implements OnInit, OnDestroy {
  loading = false;
  activeTab: DriverPortalTab = 'bus-route';

  // Dashboard Data
  dashboardData: DriverDashboardData | null = null;
  vehicle: Vehicle | null = null;
  route: TransportRoute | null = null;
  stops: RouteStop[] = [];
  todayTrips: TransportTrip[] = [];
  selectedTripId: string | number | null = null;

  // Roster & Attendance
  roster: TripBoardingLog[] = [];
  filteredRoster: TripBoardingLog[] = [];
  rosterLoading = false;
  studentSearch = '';
  activeFilter: StudentFilter = 'ALL';

  // Duty / Shift
  clockingIn = false;
  clockingOut = false;
  attendanceHistory: DriverAttendanceLog[] = [];
  historyLoading = false;

  // Live Timer
  currentTime = new Date();
  private timerInterval?: any;

  constructor(
    private transport: TransportService,
    private auth: AuthService,
    private errorHandler: ErrorHandlerService,
    private routeActivated: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Listen for tab query parameter
    this.routeActivated.queryParams.subscribe((params) => {
      if (params['tab'] && ['bus-route', 'trip-roster', 'attendance'].includes(params['tab'])) {
        this.activeTab = params['tab'] as DriverPortalTab;
      }
    });

    this.loadDashboardData();
    this.startClock();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private startClock(): void {
    this.timerInterval = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.detectChanges();
    }, 1000);
  }

  setTab(tab: DriverPortalTab): void {
    this.activeTab = tab;
    if (tab === 'attendance' && this.attendanceHistory.length === 0) {
      this.loadAttendanceHistory();
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.transport.getDriverDashboard().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.dashboardData = res.data;
          this.vehicle = res.data.vehicle;
          this.route = res.data.route;
          this.stops = res.data.stops || [];
          this.todayTrips = res.data.today_trips || [];

          if (this.todayTrips.length > 0 && !this.selectedTripId) {
            // Prefer in-progress or started trip, otherwise first scheduled
            const active = this.todayTrips.find((t) => t.status === 'Started' || t.status === 'In Progress');
            this.selectedTripId = active ? active.id : this.todayTrips[0].id;
            this.loadRoster();
          }
        }
      },
      error: (e) => {
        this.loading = false;
        this.errorHandler.showError(e);
      }
    });
  }

  get selectedTrip(): TransportTrip | null {
    if (!this.selectedTripId) return null;
    return this.todayTrips.find((t) => String(t.id) === String(this.selectedTripId)) ?? null;
  }

  onTripChange(tripId: string | number): void {
    this.selectedTripId = tripId;
    this.loadRoster();
  }

  loadRoster(): void {
    if (!this.selectedTripId) return;
    this.rosterLoading = true;
    this.transport.getTripRoster(this.selectedTripId).subscribe({
      next: (res) => {
        this.rosterLoading = false;
        this.roster = res.data || [];
        this.applyFilter();
      },
      error: (e) => {
        this.rosterLoading = false;
        this.errorHandler.showError(e);
      }
    });
  }

  setFilter(filter: StudentFilter): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    const q = (this.studentSearch || '').trim().toLowerCase();
    this.filteredRoster = this.roster.filter((item) => {
      const studentName = ((item.student as any)?.first_name + ' ' + (item.student as any)?.last_name).toLowerCase();
      const admNo = ((item.student as any)?.admission_number || '').toLowerCase();
      const matchesSearch = !q || studentName.includes(q) || admNo.includes(q);

      if (!matchesSearch) return false;

      if (this.activeFilter === 'ALL') return true;
      if (this.activeFilter === 'Boarded') return item.boarding_status === 'Boarded';
      if (this.activeFilter === 'Dropped') return item.drop_status === 'Dropped';
      if (this.activeFilter === 'Pending') return item.boarding_status === 'Pending' || !item.boarding_status;
      return true;
    });
  }

  markStudentBoarded(item: TripBoardingLog): void {
    if (!this.selectedTripId || !item.student_id) return;
    this.transport.markBoarded(this.selectedTripId, item.student_id).subscribe({
      next: (res) => {
        if (res.success) {
          item.boarding_status = 'Boarded';
          item.boarded_at = new Date().toISOString();
          this.errorHandler.showSuccess('Student marked as boarded');
          this.applyFilter();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  unmarkStudentBoarded(item: TripBoardingLog): void {
    if (!this.selectedTripId || !item.student_id) return;
    this.transport.unmarkBoarded(this.selectedTripId, item.student_id).subscribe({
      next: (res) => {
        if (res.success) {
          item.boarding_status = 'Pending';
          item.boarded_at = undefined;
          this.errorHandler.showSuccess('Boarding unmarked');
          this.applyFilter();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  markStudentDropped(item: TripBoardingLog): void {
    if (!this.selectedTripId || !item.student_id) return;
    this.transport.markDropped(this.selectedTripId, item.student_id).subscribe({
      next: (res) => {
        if (res.success) {
          item.drop_status = 'Dropped';
          item.dropped_at = new Date().toISOString();
          this.errorHandler.showSuccess('Student marked as dropped');
          this.applyFilter();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  // ── Trip State Operations ──────────────────────────────────────────────────
  startTrip(): void {
    if (!this.selectedTripId) return;
    this.transport.startTrip(this.selectedTripId).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Trip has started! Safe journey.');
          this.loadDashboardData();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  completeTrip(): void {
    if (!this.selectedTripId) return;
    this.transport.completeTrip(this.selectedTripId).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Trip completed successfully!');
          this.loadDashboardData();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  // ── Driver Duty Clock-In / Clock-Out ──────────────────────────────────────
  clockIn(): void {
    this.clockingIn = true;
    this.transport.driverClockIn().subscribe({
      next: (res) => {
        this.clockingIn = false;
        if (res.success) {
          this.errorHandler.showSuccess(res.message || 'Clocked in successfully');
          this.loadDashboardData();
        }
      },
      error: (e) => {
        this.clockingIn = false;
        this.errorHandler.showError(e);
      }
    });
  }

  clockOut(): void {
    this.clockingOut = true;
    this.transport.driverClockOut().subscribe({
      next: (res) => {
        this.clockingOut = false;
        if (res.success) {
          this.errorHandler.showSuccess(res.message || 'Clocked out successfully');
          this.loadDashboardData();
        }
      },
      error: (e) => {
        this.clockingOut = false;
        this.errorHandler.showError(e);
      }
    });
  }

  loadAttendanceHistory(): void {
    this.historyLoading = true;
    this.transport.getDriverAttendanceHistory().subscribe({
      next: (res) => {
        this.historyLoading = false;
        this.attendanceHistory = res.data || [];
      },
      error: (e) => {
        this.historyLoading = false;
        this.errorHandler.showError(e);
      }
    });
  }

  // ── Counters ───────────────────────────────────────────────────────────────
  get boardedCount(): number {
    return this.roster.filter((r) => r.boarding_status === 'Boarded').length;
  }

  get droppedCount(): number {
    return this.roster.filter((r) => r.drop_status === 'Dropped').length;
  }

  get pendingCount(): number {
    return this.roster.filter((r) => r.boarding_status === 'Pending' || !r.boarding_status).length;
  }
}
