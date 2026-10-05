import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { TransportTrip, TripBoardingLog } from '../../../../core/models/transport.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface RouteStopWithStatus {
  id: string | number;
  stop_name: string;
  landmark?: string;
  sequence_no: number;
  pickup_time?: string;
  drop_time?: string;
  latitude?: number;
  longitude?: number;
  geofence_radius?: number;
  total_students?: number;
  verified_students?: number;
  pending_students?: number;
  is_current?: boolean;
}

type ActiveMode = 'custom' | 'live';
type StudentFilter = 'ALL' | 'current_stop' | 'Pending' | 'Boarded' | 'Dropped';

@Component({
  selector: 'app-live-boarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './live-boarding.component.html',
  styleUrls: ['./live-boarding.component.scss']
})
export class LiveBoardingComponent implements OnInit, OnDestroy {
  @ViewChild('liveMapContainer') liveMapContainerRef?: ElementRef<HTMLDivElement>;

  loading = false;
  markingStop = false;
  availableTrips: TransportTrip[] = [];
  selectedTripId: string | number | null = null;
  activeTrip: TransportTrip | null = null;

  // ── Role-based access ──────────────────────────────────────────────────────
  /** Can toggle tracking mode (SuperAdmin or BranchAdmin) */
  get canToggleMode(): boolean {
    return this.auth.hasRole(['SuperAdmin', 'BranchAdmin']);
  }
  get isSuperAdmin(): boolean {
    return this.auth.hasRole('SuperAdmin');
  }
  get currentUserRole(): string {
    return this.auth.currentUser()?.role ?? 'Unknown';
  }

  // ── Dual-Flow Mode ─────────────────────────────────────────────────────────
  activeMode: ActiveMode = 'custom';

  // ── Stop Sequence & Telemetry ──────────────────────────────────────────────
  routeStops: RouteStopWithStatus[] = [];
  selectedStopId: string | number | null = null;
  currentStopId: string | number | null = null;
  filterByStopOnly = false;

  // ── Live Tracking Telemetry ────────────────────────────────────────────────
  liveTelemetry: any = null;
  private pollInterval: any = null;
  private leafletMap: any = null;
  private busMarker: any = null;
  private stopMarkers: any[] = [];
  protected mapInitialized = false;

  // ── Student Roster ─────────────────────────────────────────────────────────
  roster: TripBoardingLog[] = [];
  filteredRoster: TripBoardingLog[] = [];
  searchQuery = '';
  studentFilter: StudentFilter = 'current_stop';

  constructor(
    private transport: TransportService,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Non-admins are always in custom (view-only) mode
    if (!this.canToggleMode) {
      this.activeMode = 'custom';
    }
    this.loadAvailableTrips();
  }

  ngOnDestroy(): void {
    this.stopLivePolling();
    this.destroyMap();
  }

  // ── Trip Loading ───────────────────────────────────────────────────────────
  loadAvailableTrips(): void {
    this.transport.getTrips({ per_page: 50 }).subscribe({
      next: (res) => {
        this.availableTrips = res.data || [];
        this.route.queryParams.subscribe((params) => {
          if (params['trip_id']) {
            this.selectedTripId = params['trip_id'];
          } else if (this.availableTrips.length > 0 && !this.selectedTripId) {
            this.selectedTripId = this.availableTrips[0].id;
          }
          if (this.selectedTripId) {
            this.onTripSelected(this.selectedTripId);
          }
        });
      },
      error: () => { }
    });
  }

  onTripSelected(tripId: string | number): void {
    if (!tripId) return;
    this.selectedTripId = tripId;

    // Flush stale data immediately
    this.activeTrip = this.availableTrips.find((t) => t.id === tripId) || null;
    this.roster = [];
    this.filteredRoster = [];
    this.routeStops = [];
    this.currentStopId = null;
    this.selectedStopId = null;
    this.filterByStopOnly = false;
    this.searchQuery = '';
    this.studentFilter = 'current_stop';
    this.liveTelemetry = null;

    this.loadRoster(true);

    if (this.activeMode === 'live') {
      this.stopLivePolling();
      this.startLivePolling();
    }
  }

  reloadData(): void {
    if (!this.selectedTripId) { this.loadAvailableTrips(); return; }
    this.transport.getTrips({ per_page: 50 }).subscribe({
      next: (res) => {
        this.availableTrips = res.data || [];
        const fresh = this.availableTrips.find((t) => t.id === this.selectedTripId);
        if (fresh) this.activeTrip = { ...this.activeTrip!, ...fresh };
        this.loadRoster(true);
        if (this.activeMode === 'live') this.pollLiveTelemetry();
      },
      error: () => this.loadRoster(true)
    });
  }

  loadRoster(forceClear = false): void {
    if (!this.selectedTripId) return;
    if (forceClear) {
      this.roster = [];
      this.filteredRoster = [];
      this.routeStops = [];
      this.currentStopId = null;
      this.selectedStopId = null;
    }
    this.loading = true;
    this.transport.getTripRoster(this.selectedTripId).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          this.roster = res.data || [];
          if (res.trip) this.activeTrip = { ...this.activeTrip!, ...res.trip };

          if (res.stops?.length > 0) {
            this.routeStops = res.stops;
          } else {
            this.deriveStopsFromRoster();
          }

          if (res.current_stop_id) {
            this.currentStopId = res.current_stop_id;
          } else if (this.routeStops.length > 0) {
            this.currentStopId = this.routeStops[0].id;
          } else {
            this.currentStopId = null;
          }

          this.selectedStopId = this.currentStopId;
          this.filterByStopOnly = false;
          this.filterRoster();

          // Update live map pins if map is active
          if (this.activeMode === 'live' && this.mapInitialized) {
            this.refreshMapMarkers();
          }
          this.cdr.detectChanges();
        }
      },
      error: (e) => {
        this.loading = false;
        this.errorHandler.showError(e);
      }
    });
  }

  /** Derives stops from roster logs when route_stops table is empty */
  private deriveStopsFromRoster(): void {
    const isDrop = this.isDropTrip;
    const stopMap = new Map<string | number, RouteStopWithStatus>();
    let seq = 1;

    for (const log of this.roster) {
      const stopId = isDrop ? (log.drop_stop_id || `stop_${seq}`) : (log.pickup_stop_id || `stop_${seq}`);
      const stopName = isDrop ? (log.drop_stop_name || 'Destination') : (log.pickup_stop_name || 'Standard Stop');
      const time = isDrop ? (log.scheduled_drop_time || log.drop_time) : (log.scheduled_pickup_time || log.pickup_time);

      if (!stopMap.has(stopId)) {
        stopMap.set(stopId, {
          id: stopId,
          stop_name: stopName,
          sequence_no: seq++,
          pickup_time: !isDrop ? time : undefined,
          drop_time: isDrop ? time : undefined,
          total_students: 0,
          verified_students: 0,
          pending_students: 0
        });
      }

      const st = stopMap.get(stopId)!;
      st.total_students = (st.total_students || 0) + 1;
      const verified = isDrop ? log.status === 'Dropped' : log.status === 'Boarded';
      if (verified) { st.verified_students = (st.verified_students || 0) + 1; }
      else { st.pending_students = (st.pending_students || 0) + 1; }
    }

    this.routeStops = Array.from(stopMap.values()).sort((a, b) => a.sequence_no - b.sequence_no);
  }

  // ── Mode Switching ─────────────────────────────────────────────────────────
  toggleMode(mode: ActiveMode): void {
    if (!this.canToggleMode) return;
    this.activeMode = mode;
    if (mode === 'live') {
      this.startLivePolling();
      setTimeout(() => this.initLeafletMap(), 300);
    } else {
      this.stopLivePolling();
      this.destroyMap();
    }
  }

  private startLivePolling(): void {
    this.stopLivePolling();
    this.pollLiveTelemetry();
    this.pollInterval = setInterval(() => this.pollLiveTelemetry(), 8000);
  }

  private stopLivePolling(): void {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  pollLiveTelemetry(): void {
    if (!this.selectedTripId) return;
    this.transport.getLiveTracking(this.selectedTripId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.liveTelemetry = res.data.telemetry || null;
          if (res.data.trip) this.activeTrip = { ...this.activeTrip!, ...res.data.trip };

          if (res.data.trip?.current_stop_id) {
            this.currentStopId = res.data.trip.current_stop_id;
            this.selectedStopId = this.currentStopId;
            this.filterRoster();
          }

          // Move bus marker on live map
          const lat = this.activeTrip?.current_latitude;
          const lng = this.activeTrip?.current_longitude;
          if (lat && lng && this.mapInitialized) {
            this.updateBusMarker(lat, lng);
          }
          this.cdr.detectChanges();
        }
      },
      error: () => { }
    });
  }

  // ── Leaflet Map (Live Mode) ────────────────────────────────────────────────
  private async initLeafletMap(): Promise<void> {
    if (this.mapInitialized) return;
    const container = document.getElementById('live-leaflet-map');
    if (!container) return;

    const L = (window as any)['L'];
    if (!L) {
      // Inject Leaflet CSS + JS dynamically if not present
      await this.injectLeaflet();
      setTimeout(() => this.initLeafletMap(), 500);
      return;
    }

    const centerStop = this.routeStops.find(s => s.latitude != null && s.longitude != null) || this.routeStops[0];
    const centerLat = centerStop?.latitude != null ? parseFloat(String(centerStop.latitude)) : 16.5175;
    const centerLng = centerStop?.longitude != null ? parseFloat(String(centerStop.longitude)) : 81.7253;
    const center: [number, number] = [
      isNaN(centerLat) ? 16.5175 : centerLat,
      isNaN(centerLng) ? 81.7253 : centerLng
    ];

    this.leafletMap = L.map('live-leaflet-map', { zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.leafletMap);
    this.leafletMap.setView(center, 13);
    this.mapInitialized = true;
    this.refreshMapMarkers();
  }

  private async injectLeaflet(): Promise<void> {
    if ((window as any)['L']) return;

    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // JS
    return new Promise((resolve) => {
      if ((window as any)['L']) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  private refreshMapMarkers(): void {
    const L = (window as any)['L'];
    if (!L || !this.leafletMap) return;

    // Remove old markers
    this.stopMarkers.forEach(m => this.leafletMap.removeLayer(m));
    this.stopMarkers = [];

    const validStops = this.routeStops.filter(s =>
      s.latitude != null && s.longitude != null &&
      !isNaN(parseFloat(String(s.latitude))) && !isNaN(parseFloat(String(s.longitude)))
    );

    validStops.forEach((stop, i) => {
      const isCurrent = stop.id == this.currentStopId;
      const isUpcoming = i > this.routeStops.findIndex(s => s.id == this.currentStopId);
      const isPast = i < this.routeStops.findIndex(s => s.id == this.currentStopId);

      const color = isCurrent ? '#00897b' : isPast ? '#4caf50' : '#94a3b8';
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;">${stop.sequence_no}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const pendingCount = stop.pending_students ?? 0;
      const verifiedCount = stop.verified_students ?? 0;
      const sLat = parseFloat(String(stop.latitude));
      const sLng = parseFloat(String(stop.longitude));

      const marker = L.marker([sLat, sLng], { icon })
        .bindPopup(`
          <div style="min-width:180px;font-family:sans-serif;">
            <strong style="font-size:14px;color:#00897b;">#${stop.sequence_no} ${stop.stop_name}</strong>
            ${stop.landmark ? `<div style="color:#64748b;font-size:12px;margin-top:2px;">${stop.landmark}</div>` : ''}
            <hr style="margin:6px 0;border-color:#e2e8f0;">
            <div style="display:flex;gap:8px;font-size:12px;">
              <span style="color:#2e7d32;">✓ ${verifiedCount} Boarded</span>
              <span style="color:#e65100;">⧖ ${pendingCount} Pending</span>
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;">
              ${isCurrent ? '🚌 Bus is HERE' : isUpcoming ? '⏭ Upcoming stop' : '✅ Completed'}
            </div>
          </div>
        `)
        .addTo(this.leafletMap);
      this.stopMarkers.push(marker);
    });

    // Draw route polyline
    if (validStops.length >= 2) {
      const latlngs = validStops.map(s => [parseFloat(String(s.latitude)), parseFloat(String(s.longitude))] as [number, number]);
      (this.leafletMap as any)._routeLine?.remove();
      (this.leafletMap as any)._routeLine = L.polyline(latlngs, {
        color: '#00897b', weight: 4, opacity: 0.75, dashArray: '8, 6'
      }).addTo(this.leafletMap);
      this.leafletMap.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
    }

    // Bus position marker
    const rawLat = this.activeTrip?.current_latitude;
    const rawLng = this.activeTrip?.current_longitude;
    if (rawLat != null && rawLng != null) {
      const lat = parseFloat(String(rawLat));
      const lng = parseFloat(String(rawLng));
      if (!isNaN(lat) && !isNaN(lng)) {
        this.updateBusMarker(lat, lng);
      }
    }
  }

  private updateBusMarker(lat: number | string, lng: number | string): void {
    const L = (window as any)['L'];
    if (!L || !this.leafletMap) return;
    const numLat = parseFloat(String(lat));
    const numLng = parseFloat(String(lng));
    if (isNaN(numLat) || isNaN(numLng)) return;

    if (this.busMarker) this.leafletMap.removeLayer(this.busMarker);

    const busIcon = L.divIcon({
      className: '',
      html: `<div style="background:#00897b;width:44px;height:44px;border-radius:50%;border:4px solid #fff;box-shadow:0 4px 14px rgba(0,137,123,0.5);display:flex;align-items:center;justify-content:center;font-size:22px;animation:pulse 1.5s infinite;">🚌</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    this.busMarker = L.marker([numLat, numLng], { icon: busIcon, zIndexOffset: 1000 })
      .bindPopup(`<strong>🚌 Bus Live Location</strong><br>Speed: ${this.liveTelemetry?.speed ?? 0} km/h`)
      .addTo(this.leafletMap);
    this.leafletMap.panTo([numLat, numLng]);
  }

  private destroyMap(): void {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
      this.busMarker = null;
      this.stopMarkers = [];
      this.mapInitialized = false;
    }
  }

  simulateGpsPing(): void {
    if (!this.selectedTripId) return;
    const currStop = this.currentStop;
    const baseLat = parseFloat(String(currStop?.latitude ?? '16.5175')) || 16.5175;
    const baseLng = parseFloat(String(currStop?.longitude ?? '81.7253')) || 81.7253;
    const newLat = parseFloat((baseLat + (Math.random() - 0.5) * 0.003).toFixed(7));
    const newLng = parseFloat((baseLng + (Math.random() - 0.5) * 0.003).toFixed(7));
    const newSpeed = Math.floor(25 + Math.random() * 20);

    this.transport.updateTripGps(this.selectedTripId, {
      latitude: newLat,
      longitude: newLng,
      speed: newSpeed
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess(`GPS Ping simulated: ${newLat.toFixed(5)}, ${newLng.toFixed(5)} (${newSpeed} km/h)`);
          this.pollLiveTelemetry();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  // ── Custom Mode: Stop Selection ────────────────────────────────────────────
  selectStop(stopId: string | number | null): void {
    if (this.selectedStopId === stopId && this.filterByStopOnly) {
      this.filterByStopOnly = false;
    } else {
      this.selectedStopId = stopId;
      this.filterByStopOnly = true;
      this.studentFilter = 'current_stop';
    }
    this.filterRoster();
  }

  clearStopFilter(): void {
    this.filterByStopOnly = false;
    this.studentFilter = 'ALL';
    this.filterRoster();
  }

  markStopReached(stop?: RouteStopWithStatus): void {
    if (!this.selectedTripId || !this.canToggleMode) return;
    const targetStop = stop || this.focusedStop || this.currentStop || this.routeStops[0];
    if (!targetStop) return;

    this.markingStop = true;
    this.transport.reachStop(this.selectedTripId, { stop_id: targetStop.id, auto_verify: true }).subscribe({
      next: (res) => {
        this.markingStop = false;
        if (res.success) {
          this.currentStopId = targetStop.id;
          this.errorHandler.showSuccess(res.message || `Stop "${targetStop.stop_name}" marked as reached!`);
          this.loadRoster();
        } else {
          this.errorHandler.showError(res.message || 'Failed to update stop');
        }
      },
      error: (e) => { this.markingStop = false; this.errorHandler.showError(e); }
    });
  }

  advanceToNextStop(): void {
    if (!this.routeStops.length || !this.canToggleMode) return;
    const currentIndex = this.routeStops.findIndex((s) => s.id == this.currentStopId);
    if (currentIndex < this.routeStops.length - 1) {
      const next = this.routeStops[currentIndex + 1];
      this.markStopReached(next);
      this.selectedStopId = next.id;
    } else {
      this.errorHandler.showSuccess('All route stops have been completed!');
    }
  }

  // ── Student Roster Filtering ───────────────────────────────────────────────
  setStudentFilter(filter: StudentFilter): void {
    this.studentFilter = filter;
    if (filter === 'current_stop') {
      this.selectedStopId = this.currentStopId;
      this.filterByStopOnly = true;
    } else if (filter === 'ALL') {
      this.filterByStopOnly = false;
    } else {
      this.filterByStopOnly = false;
    }
    this.filterRoster();
  }

  filterRoster(): void {
    let result = [...this.roster];

    // Status filter
    if (this.studentFilter === 'Pending' || this.studentFilter === 'Boarded' || this.studentFilter === 'Dropped') {
      result = result.filter((r) => r.status === this.studentFilter);
    }

    // Stop filter (current_stop or manually selected stop)
    if (this.filterByStopOnly && this.selectedStopId) {
      const isDrop = this.isDropTrip;
      const targetStop = this.focusedStop;
      result = result.filter((r) => {
        if (isDrop) {
          return (r.drop_stop_id && r.drop_stop_id == this.selectedStopId) ||
            (targetStop && r.drop_stop_name === targetStop.stop_name);
        } else {
          return (r.pickup_stop_id && r.pickup_stop_id == this.selectedStopId) ||
            (targetStop && r.pickup_stop_name === targetStop.stop_name);
        }
      });
    }

    // Search
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((r) =>
        (r.student_name?.toLowerCase().includes(q)) ||
        (r.admission_no?.toLowerCase().includes(q))
      );
    }

    this.filteredRoster = result;
  }

  // ── Individual Student Actions ─────────────────────────────────────────────
  markBoarded(log: TripBoardingLog): void {
    if (!this.selectedTripId) return;
    this.transport.markBoarded(this.selectedTripId, log.student_id).subscribe({
      next: (res) => {
        if (res.success) {
          log.status = 'Boarded';
          log.boarded_at = res.data?.boarded_at || new Date().toISOString();
          this.filterRoster();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  unmarkBoarded(log: TripBoardingLog): void {
    if (!this.selectedTripId) return;
    this.transport.unmarkBoarded(this.selectedTripId, log.student_id).subscribe({
      next: (res) => {
        if (res.success) {
          log.status = 'Pending';
          log.boarded_at = null;
          this.filterRoster();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  markDropped(log: TripBoardingLog): void {
    if (!this.selectedTripId) return;
    this.transport.markDropped(this.selectedTripId, log.student_id).subscribe({
      next: (res) => {
        if (res.success) {
          log.status = 'Dropped';
          log.dropped_at = res.data?.dropped_at || new Date().toISOString();
          this.filterRoster();
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }

  // ── Getters ────────────────────────────────────────────────────────────────
  get isDropTrip(): boolean {
    return ['drop', 'afternoon'].includes((this.activeTrip?.trip_type ?? '').toLowerCase());
  }

  get currentStop(): RouteStopWithStatus | undefined {
    return this.routeStops.find((s) => s.id == this.currentStopId);
  }

  get focusedStop(): RouteStopWithStatus | undefined {
    return this.routeStops.find((s) => s.id == this.selectedStopId);
  }

  get nextStop(): RouteStopWithStatus | undefined {
    const idx = this.routeStops.findIndex((s) => s.id == this.currentStopId);
    return idx >= 0 && idx < this.routeStops.length - 1 ? this.routeStops[idx + 1] : undefined;
  }

  get completedStopsCount(): number {
    if (!this.currentStopId) return 0;
    const idx = this.routeStops.findIndex((s) => s.id == this.currentStopId);
    return Math.max(0, idx + 1);
  }

  get tripProgressPercent(): number {
    if (!this.routeStops.length) return 0;
    return Math.round((this.completedStopsCount / this.routeStops.length) * 100);
  }

  get busLocationSummary(): string {
    if (!this.currentStop) return 'Bus Ready at Dispatch Origin';
    if (this.nextStop) return `At Stop ${this.currentStop.sequence_no}: ${this.currentStop.stop_name} → Next: ${this.nextStop.stop_name}`;
    return `At Final Destination: ${this.currentStop.stop_name}`;
  }

  get boardedCount(): number { return this.roster.filter((r) => r.status === 'Boarded').length; }
  get droppedCount(): number { return this.roster.filter((r) => r.status === 'Dropped').length; }
  get pendingCount(): number { return this.roster.filter((r) => r.status === 'Pending').length; }

  stopStatusLabel(stop: RouteStopWithStatus): 'completed' | 'current' | 'upcoming' {
    const currIdx = this.routeStops.findIndex(s => s.id == this.currentStopId);
    const thisIdx = this.routeStops.findIndex(s => s.id == stop.id);
    if (thisIdx < currIdx) return 'completed';
    if (thisIdx === currIdx) return 'current';
    return 'upcoming';
  }
}
