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
  TransportRoute,
  StudentTransport
} from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface RouteStopEnriched extends RouteStop {
  total_students?: number;
  verified_students?: number;
  pending_students?: number;
  is_current?: boolean;
}

export type DriverPortalTab = 'profile-duty' | 'boarding';
export type StudentFilter = 'current_stop' | 'ALL' | 'Pending' | 'Boarded' | 'Dropped';

@Component({
  selector: 'app-driver-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './driver-portal.component.html',
  styleUrls: ['./driver-portal.component.scss']
})
export class DriverPortalComponent implements OnInit, OnDestroy {
  loading = false;
  activeTab: DriverPortalTab = 'profile-duty';

  // ── Dashboard Master Entities ──────────────────────────────────────────────
  dashboardData: DriverDashboardData | null = null;
  vehicle: Vehicle | null = null;
  route: TransportRoute | null = null;
  stops: RouteStop[] = [];
  assignedStudents: StudentTransport[] = [];
  todayTrips: TransportTrip[] = [];
  selectedTripId: string | number | null = null;

  // ── Tab 1: Duty & Attendance Logs DataTable ────────────────────────────────
  clockingIn = false;
  clockingOut = false;
  attendanceHistory: DriverAttendanceLog[] = [];
  filteredAttendance: DriverAttendanceLog[] = [];
  historyLoading = false;
  attendanceSearch = '';
  attendanceStatusFilter = 'ALL';

  // Shift Modal State
  showDutyModal = false;
  dutyActionType: 'in' | 'out' = 'in';
  odometerInput: number | null = null;
  dutyRemarksInput = '';
  submittingDuty = false;

  readonly dutyColumns = [
    'date',
    'check_in',
    'check_out',
    'total_hours',
    'km_driven',
    'status',
    'remarks'
  ];
  readonly stopColumns = ['seq', 'stop_name', 'landmark', 'pickup', 'drop'];
  readonly studentColumns = ['student', 'pickup', 'drop', 'fee', 'status'];

  // ── Tab 2: Boarding Generation & Live Trip Execution ───────────────────────
  routeStops: RouteStopEnriched[] = [];
  currentStopId: string | number | null = null;
  selectedStopId: string | number | null = null;
  filterByStopOnly = false;
  markingStop = false;

  // Trip Generation Modal
  showGenerateTripModal = false;
  generatingTrip = false;
  newTripType: 'Pickup' | 'Drop' = 'Pickup';

  // Roster & Manifest
  roster: TripBoardingLog[] = [];
  filteredRoster: TripBoardingLog[] = [];
  rosterLoading = false;
  studentSearch = '';
  studentFilter: StudentFilter = 'current_stop';

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

  get currentUserRole(): string {
    return this.auth.currentUser()?.role ?? 'Driver';
  }

  ngOnInit(): void {
    this.routeActivated.queryParams.subscribe((params) => {
      const tabParam = params['tab'];
      if (tabParam === 'boarding' || tabParam === 'trip-roster') {
        this.activeTab = 'boarding';
      } else if (tabParam === 'profile-duty' || tabParam === 'bus-route' || tabParam === 'attendance') {
        this.activeTab = 'profile-duty';
      }
    });

    this.loadDashboardData();
    this.loadAttendanceHistory();
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
    if (tab === 'profile-duty' && this.attendanceHistory.length === 0) {
      this.loadAttendanceHistory();
    }
    if (tab === 'boarding' && this.todayTrips.length > 0 && !this.selectedTripId) {
      this.selectedTripId = this.todayTrips[0].id;
      this.loadRoster();
    }
  }

  // ── Master Dashboard Data Loading ──────────────────────────────────────────
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

          if (this.route?.id) {
            this.loadRouteStudents(this.route.id);
          }

          if (this.todayTrips.length > 0 && !this.selectedTripId) {
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

  loadRouteStudents(routeId: string | number): void {
    this.transport.getRouteStudents(routeId).subscribe({
      next: (res) => {
        this.assignedStudents = res.data || [];
      },
      error: () => {}
    });
  }

  get sortedStops(): RouteStop[] {
    return [...(this.stops || [])].sort(
      (a, b) => (Number(a.sequence_no) || 0) - (Number(b.sequence_no) || 0)
    );
  }

  // ── Tab 1: Duty & Attendance DataTable Logic ───────────────────────────────
  loadAttendanceHistory(): void {
    this.historyLoading = true;
    this.transport.getDriverAttendanceHistory().subscribe({
      next: (res: any) => {
        this.historyLoading = false;
        this.attendanceHistory = res.data || [];
        this.applyAttendanceFilter();
      },
      error: (e) => {
        this.historyLoading = false;
        this.errorHandler.showError(e);
      }
    });
  }

  applyAttendanceFilter(): void {
    const q = (this.attendanceSearch || '').trim().toLowerCase();
    const statusF = this.attendanceStatusFilter;

    this.filteredAttendance = this.attendanceHistory.filter((item) => {
      // Status filter
      if (statusF !== 'ALL' && item.status?.toUpperCase() !== statusF.toUpperCase()) {
        return false;
      }
      // Text search
      if (!q) return true;
      const dateStr = (item.formatted_date || item.date || '').toLowerCase();
      const dayStr = (item.day || '').toLowerCase();
      const statusStr = (item.status || '').toLowerCase();
      const remarksStr = (item.remarks || '').toLowerCase();
      return (
        dateStr.includes(q) ||
        dayStr.includes(q) ||
        statusStr.includes(q) ||
        remarksStr.includes(q)
      );
    });
  }

  setAttendanceStatusFilter(status: string): void {
    this.attendanceStatusFilter = status;
    this.applyAttendanceFilter();
  }

  // Attendance KPIs
  get totalDutyDays(): number {
    return this.attendanceHistory.length;
  }

  get totalDutyHours(): number {
    const total = this.attendanceHistory.reduce((sum, a) => sum + (Number(a.total_hours) || 0), 0);
    return Math.round(total * 10) / 10;
  }

  get avgDutyHours(): number {
    if (!this.totalDutyDays) return 0;
    return Math.round((this.totalDutyHours / this.totalDutyDays) * 10) / 10;
  }

  get totalKmDriven(): number {
    return this.attendanceHistory.reduce((sum, a) => sum + (Number(a.km_driven) || 0), 0);
  }

  // Duty Shift Modal Operations
  openDutyModal(type: 'in' | 'out'): void {
    this.dutyActionType = type;
    this.odometerInput = null;
    this.dutyRemarksInput = '';
    this.showDutyModal = true;
  }

  closeDutyModal(): void {
    this.showDutyModal = false;
  }

  submitDutyAction(): void {
    this.submittingDuty = true;
    const payload = {
      odometer: this.odometerInput ? Number(this.odometerInput) : undefined,
      remarks: this.dutyRemarksInput ? this.dutyRemarksInput.trim() : undefined
    };

    if (this.dutyActionType === 'in') {
      this.transport.driverClockIn(payload).subscribe({
        next: (res) => {
          this.submittingDuty = false;
          this.showDutyModal = false;
          this.errorHandler.showSuccess(res.message || 'Duty started successfully');
          this.loadDashboardData();
          this.loadAttendanceHistory();
        },
        error: (e) => {
          this.submittingDuty = false;
          this.errorHandler.showError(e);
        }
      });
    } else {
      this.transport.driverClockOut(payload).subscribe({
        next: (res) => {
          this.submittingDuty = false;
          this.showDutyModal = false;
          this.errorHandler.showSuccess(res.message || 'Duty ended successfully');
          this.loadDashboardData();
          this.loadAttendanceHistory();
        },
        error: (e) => {
          this.submittingDuty = false;
          this.errorHandler.showError(e);
        }
      });
    }
  }

  // ── Tab 2: Trip Roster & Boarding Generation ───────────────────────────────
  get selectedTrip(): TransportTrip | null {
    if (!this.selectedTripId) return null;
    return this.todayTrips.find((t) => String(t.id) === String(this.selectedTripId)) ?? null;
  }

  onTripChange(tripId: string | number): void {
    this.selectedTripId = tripId;
    this.selectedStopId = null;
    this.filterByStopOnly = false;
    this.studentFilter = 'current_stop';
    this.loadRoster();
  }

  openGenerateTripModal(): void {
    this.newTripType = this.isDropTrip ? 'Pickup' : 'Drop';
    this.showGenerateTripModal = true;
  }

  closeGenerateTripModal(): void {
    this.showGenerateTripModal = false;
  }

  generateTrip(): void {
    if (!this.route?.id && !this.vehicle?.id) {
      this.errorHandler.showError('No assigned route or vehicle available to generate trip');
      return;
    }

    this.generatingTrip = true;
    this.transport
      .generateDriverTrip({
        trip_type: this.newTripType,
        route_id: this.route?.id,
        vehicle_id: this.vehicle?.id
      })
      .subscribe({
        next: (res) => {
          this.generatingTrip = false;
          this.showGenerateTripModal = false;
          this.errorHandler.showSuccess(`New ${this.newTripType} Trip generated successfully!`);
          if (res.data?.id) {
            this.selectedTripId = res.data.id;
          }
          this.loadDashboardData();
        },
        error: (e) => {
          this.generatingTrip = false;
          this.errorHandler.showError(e);
        }
      });
  }

  loadRoster(): void {
    if (!this.selectedTripId) return;
    this.rosterLoading = true;
    this.transport.getTripRoster(this.selectedTripId).subscribe({
      next: (res: any) => {
        this.rosterLoading = false;
        this.roster = res.data || [];

        // Synchronize stops
        if (res.stops && res.stops.length > 0) {
          this.routeStops = res.stops;
        } else if (this.stops && this.stops.length > 0) {
          this.routeStops = this.stops.map((s, idx) => ({
            ...s,
            sequence_no: s.sequence_no || idx + 1,
            total_students: 0,
            verified_students: 0,
            pending_students: 0
          }));
        }

        if (res.current_stop_id) {
          this.currentStopId = res.current_stop_id;
        } else if (this.selectedTrip?.current_stop_id) {
          this.currentStopId = this.selectedTrip.current_stop_id;
        } else if (this.routeStops.length > 0 && !this.currentStopId) {
          this.currentStopId = this.routeStops[0]?.id ?? null;
        }

        this.enrichRouteStopsFromRoster();
        this.applyFilter();
      },
      error: (e) => {
        this.rosterLoading = false;
        this.errorHandler.showError(e);
      }
    });
  }

  private enrichRouteStopsFromRoster(): void {
    if (!this.routeStops.length || !this.roster.length) return;
    const isDrop = this.isDropTrip;

    for (const stop of this.routeStops) {
      const matching = this.roster.filter((r) => {
        const stopName = isDrop ? r.drop_stop_name || '' : r.pickup_stop_name || '';
        const stopId = isDrop ? r.drop_stop_id : r.pickup_stop_id;
        return (
          (stopId && String(stopId) === String(stop.id)) ||
          (stopName && stopName.trim().toLowerCase() === (stop.stop_name || '').trim().toLowerCase())
        );
      });

      stop.total_students = matching.length;
      if (isDrop) {
        stop.verified_students = matching.filter(
          (m) => m.drop_status === 'Dropped' || m.status === 'Dropped'
        ).length;
        stop.pending_students = matching.filter(
          (m) => m.drop_status !== 'Dropped' && m.status !== 'Dropped'
        ).length;
      } else {
        stop.verified_students = matching.filter(
          (m) => m.boarding_status === 'Boarded' || m.status === 'Boarded'
        ).length;
        stop.pending_students = matching.filter(
          (m) => m.boarding_status !== 'Boarded' && m.status !== 'Boarded'
        ).length;
      }
    }
  }

  getStudentName(log: TripBoardingLog): string {
    if (log.student_name) return log.student_name;
    if (log.student) {
      return `${log.student.first_name || ''} ${log.student.last_name || ''}`.trim() || 'Student';
    }
    return 'Student';
  }

  getStudentAdmissionNo(log: TripBoardingLog): string {
    return log.admission_number || log.admission_no || log.student?.admission_number || '';
  }

  // ── Stop Timeline & Stop Actions ───────────────────────────────────────────
  selectStop(stopId: string | number | undefined): void {
    if (!stopId) return;
    if (this.selectedStopId === stopId && this.filterByStopOnly) {
      this.filterByStopOnly = false;
      this.selectedStopId = null;
      this.studentFilter = 'ALL';
    } else {
      this.selectedStopId = stopId;
      this.filterByStopOnly = true;
      this.studentFilter = 'current_stop';
    }
    this.applyFilter();
  }

  clearStopFilter(): void {
    this.filterByStopOnly = false;
    this.selectedStopId = null;
    this.studentFilter = 'ALL';
    this.applyFilter();
  }

  setStudentFilter(filter: StudentFilter): void {
    this.studentFilter = filter;
    if (filter !== 'current_stop') {
      this.filterByStopOnly = false;
    }
    this.applyFilter();
  }

  applyFilter(): void {
    const q = (this.studentSearch || '').trim().toLowerCase();
    const isDrop = this.isDropTrip;

    this.filteredRoster = this.roster.filter((item) => {
      // 1. Search Query Match
      const studentName = (
        item.student_name ||
        ((item.student as any)?.first_name || '') + ' ' + ((item.student as any)?.last_name || '')
      )
        .trim()
        .toLowerCase();
      const admNo = (
        item.admission_number ||
        (item.student as any)?.admission_number ||
        ''
      ).toLowerCase();
      const matchesSearch = !q || studentName.includes(q) || admNo.includes(q);
      if (!matchesSearch) return false;

      // 2. Stop Filter
      if (this.studentFilter === 'current_stop') {
        const targetStop = this.focusedStop || this.currentStop;
        if (targetStop) {
          const stopName = (
            isDrop ? item.drop_stop_name || '' : item.pickup_stop_name || ''
          )
            .trim()
            .toLowerCase();
          const stopId = isDrop ? item.drop_stop_id : item.pickup_stop_id;
          const targetName = (targetStop.stop_name || '').trim().toLowerCase();
          const matchesStop =
            (stopId && String(stopId) === String(targetStop.id)) ||
            (stopName && stopName === targetName);
          if (!matchesStop) return false;
        }
      }

      // 3. Status Filters
      if (this.studentFilter === 'Boarded') {
        return item.boarding_status === 'Boarded' || item.status === 'Boarded';
      }
      if (this.studentFilter === 'Dropped') {
        return item.drop_status === 'Dropped' || item.status === 'Dropped';
      }
      if (this.studentFilter === 'Pending') {
        if (isDrop) {
          return item.drop_status !== 'Dropped' && item.status !== 'Dropped';
        }
        return item.boarding_status !== 'Boarded' && item.status !== 'Boarded';
      }

      return true;
    });
  }

  markStopReached(stop?: RouteStopEnriched | null): void {
    if (!this.selectedTripId) return;
    const targetStop = stop || this.focusedStop || this.currentStop;
    if (!targetStop) return;

    this.markingStop = true;
    this.transport
      .reachStop(this.selectedTripId, { stop_id: targetStop.id, auto_verify: true })
      .subscribe({
        next: (res: any) => {
          this.markingStop = false;
          this.errorHandler.showSuccess(res.message || `Stop reached: ${targetStop.stop_name}`);
          if (res.current_stop_id) {
            this.currentStopId = res.current_stop_id;
          }
          this.loadRoster();
        },
        error: (e) => {
          this.markingStop = false;
          this.errorHandler.showError(e);
        }
      });
  }

  advanceToNextStop(): void {
    if (!this.selectedTripId) return;
    const next = this.nextStop;
    if (!next) {
      this.errorHandler.showInfo('This is already the last stop on the route.');
      return;
    }

    this.markingStop = true;
    this.transport
      .reachStop(this.selectedTripId, { stop_id: next.id, auto_verify: true })
      .subscribe({
        next: () => {
          this.markingStop = false;
          this.errorHandler.showSuccess(`Advanced to next stop: ${next.stop_name}`);
          this.currentStopId = next.id ?? null;
          this.selectedStopId = null;
          this.loadRoster();
        },
        error: (e) => {
          this.markingStop = false;
          this.errorHandler.showError(e);
        }
      });
  }

  jumpToStop(stopId: string | number): void {
    if (!this.selectedTripId || !stopId) return;
    this.markingStop = true;
    this.transport
      .reachStop(this.selectedTripId, { stop_id: stopId, auto_verify: false })
      .subscribe({
        next: () => {
          this.markingStop = false;
          this.currentStopId = stopId;
          this.selectedStopId = stopId;
          this.errorHandler.showSuccess('Active stop updated');
          this.loadRoster();
        },
        error: (e) => {
          this.markingStop = false;
          this.errorHandler.showError(e);
        }
      });
  }

  // ── Individual Student Actions ─────────────────────────────────────────────
  markStudentBoarded(item: TripBoardingLog): void {
    if (!this.selectedTripId || !item.student_id) return;
    this.transport.markBoarded(this.selectedTripId, item.student_id).subscribe({
      next: (res) => {
        if (res.success) {
          item.boarding_status = 'Boarded';
          item.status = 'Boarded';
          item.boarded_at = new Date().toISOString();
          this.errorHandler.showSuccess('Student marked as boarded');
          this.enrichRouteStopsFromRoster();
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
          item.status = 'Pending';
          item.boarded_at = undefined;
          this.errorHandler.showSuccess('Boarding unmarked');
          this.enrichRouteStopsFromRoster();
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
          item.status = 'Dropped';
          item.dropped_at = new Date().toISOString();
          this.errorHandler.showSuccess('Student marked as dropped');
          this.enrichRouteStopsFromRoster();
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

  // ── Computed Getters ───────────────────────────────────────────────────────
  get currentStop(): RouteStopEnriched | null {
    if (!this.routeStops.length) return null;
    if (this.currentStopId) {
      return (
        this.routeStops.find((s) => String(s.id) === String(this.currentStopId)) ??
        this.routeStops[0]
      );
    }
    return this.routeStops[0];
  }

  get focusedStop(): RouteStopEnriched | null {
    if (this.selectedStopId) {
      return (
        this.routeStops.find((s) => String(s.id) === String(this.selectedStopId)) ?? null
      );
    }
    return this.currentStop;
  }

  get nextStop(): RouteStopEnriched | null {
    if (!this.routeStops.length || !this.currentStop) return null;
    const currentSeq = Number(this.currentStop.sequence_no || 0);
    return this.routeStops.find((s) => Number(s.sequence_no || 0) > currentSeq) ?? null;
  }

  get completedStopsCount(): number {
    if (!this.currentStop || !this.routeStops.length) return 0;
    const curSeq = Number(this.currentStop.sequence_no || 0);
    return this.routeStops.filter((s) => Number(s.sequence_no || 0) < curSeq).length;
  }

  get tripProgressPercent(): number {
    if (!this.routeStops.length) return 0;
    return Math.min(
      100,
      Math.round((this.completedStopsCount / this.routeStops.length) * 100)
    );
  }

  get isDropTrip(): boolean {
    const type = (this.selectedTrip?.trip_type || '').toLowerCase();
    return type.includes('drop') || type.includes('afternoon') || type.includes('evening');
  }

  get busLocationSummary(): string {
    if (!this.currentStop) return 'En Route to First Stop';
    if (this.nextStop) {
      return `At Stop #${this.currentStop.sequence_no} (${this.currentStop.stop_name}) → Heading to #${this.nextStop.sequence_no} (${this.nextStop.stop_name})`;
    }
    return `At Final Stop (#${this.currentStop.sequence_no} ${this.currentStop.stop_name})`;
  }

  stopStatusLabel(stop: RouteStopEnriched): 'completed' | 'current' | 'upcoming' {
    if (!this.currentStop) return 'upcoming';
    const curSeq = Number(this.currentStop.sequence_no || 0);
    const thisSeq = Number(stop.sequence_no || 0);
    if (String(stop.id) === String(this.currentStop.id) || thisSeq === curSeq) {
      return 'current';
    }
    return thisSeq < curSeq ? 'completed' : 'upcoming';
  }

  get boardedCount(): number {
    return this.roster.filter(
      (r) => r.boarding_status === 'Boarded' || r.status === 'Boarded'
    ).length;
  }

  get droppedCount(): number {
    return this.roster.filter(
      (r) => r.drop_status === 'Dropped' || r.status === 'Dropped'
    ).length;
  }

  get pendingCount(): number {
    if (this.isDropTrip) {
      return this.roster.filter(
        (r) => r.drop_status !== 'Dropped' && r.status !== 'Dropped'
      ).length;
    }
    return this.roster.filter(
      (r) => r.boarding_status !== 'Boarded' && r.status !== 'Boarded'
    ).length;
  }
}
