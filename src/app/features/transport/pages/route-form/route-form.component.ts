import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { RouteStop, TransportRoute, TransportStopMaster } from '../../../../core/models/transport.model';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './route-form.component.html',
  styleUrls: ['./route-form.component.scss']
})
export class RouteFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  branches: { id: string | number; name: string }[] = [];
  masterStops: TransportStopMaster[] = [];
  private routeId: string | null = null;

  constructor(
    private fb: FormBuilder, private transport: TransportService, private branchService: BranchService,
    private route: ActivatedRoute, private router: Router, private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      branch_id: [null, Validators.required],
      route_number: ['', [Validators.required, Validators.maxLength(50)]],
      route_name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      distance: [null],
      estimated_time: [null],
      fare: [0, [Validators.required, Validators.min(0)]],
      is_active: [true],
      stops: this.fb.array([])
    });
    this.loadBranches();
    this.loadMasterStops();
    this.routeId = this.route.snapshot.paramMap.get('id');
    if (this.routeId) { this.isEdit = true; this.loadRoute(this.routeId); } else { this.addStop(); }
  }

  loadMasterStops(): void {
    this.transport.getStops({ per_page: 500 }).subscribe({
      next: (res) => {
        this.masterStops = res.data || [];
      },
      error: () => {}
    });
  }

  get stops(): FormArray { return this.form.get('stops') as FormArray; }

  private stopGroup(s?: RouteStop): FormGroup {
    return this.fb.group({
      stop_name: [s?.stop_name ?? '', Validators.required],
      pickup_time: [this.hm(s?.pickup_time)],
      drop_time: [this.hm(s?.drop_time)],
      latitude: [s?.latitude ?? null],
      longitude: [s?.longitude ?? null],
      geofence_radius: [s?.geofence_radius ?? 50]
    });
  }

  onStopSelectionChange(index: number, selectedName: string): void {
    const row = this.stops.at(index);
    if (!row) return;

    if (selectedName === '__custom__') {
      row.patchValue({ stop_name: '' });
      return;
    }

    const found = this.masterStops.find(m => m.stop_name === selectedName);
    if (found) {
      row.patchValue({
        stop_name: found.stop_name,
        latitude: found.latitude ?? null,
        longitude: found.longitude ?? null,
        geofence_radius: found.geofence_radius ?? 50
      });
    }
  }

  /** Normalise 'HH:mm:ss' -> 'HH:mm' for the time input. */
  private hm(t?: string | null): string {
    return t ? t.substring(0, 5) : '';
  }

  addStop(s?: RouteStop): void { this.stops.push(this.stopGroup(s)); }
  removeStop(i: number): void { this.stops.removeAt(i); }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({ next: (res) => { this.branches = (res.success && res.data) ? res.data.map(b => ({ id: b.id, name: b.name })) : []; }, error: () => {} });
  }

  private loadRoute(id: string): void {
    this.transport.getRoute(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const r = res.data as TransportRoute & { stops?: RouteStop[] };
          this.form.patchValue({ branch_id: r.branch?.id ?? r.branch_id, route_number: r.route_number, route_name: r.route_name, description: r.description, distance: r.distance, estimated_time: r.estimated_time, fare: r.fare, is_active: r.is_active });
          this.form.get('branch_id')?.disable();
          this.stops.clear();
          (r.stops || []).forEach(s => this.addStop(s));
          if (!this.stops.length) { this.addStop(); }
        }
      }, error: (e) => this.errorHandler.showError(e)
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const raw = this.form.getRawValue();
    const payload: any = { ...raw, stops: (raw.stops || []).map((s: any, i: number) => ({ ...s, sequence_no: i + 1 })) };
    const done = (m: string) => { this.saving = false; this.errorHandler.showSuccess(m); this.router.navigate(['/transport/routes']); };
    const fail = (e: unknown) => { this.errorHandler.showError(e); this.saving = false; };
    if (this.isEdit && this.routeId) {
      delete payload.branch_id;
      this.transport.updateRoute(this.routeId, payload).subscribe({ next: (r) => r.success ? done('Route updated') : fail(r.message), error: fail });
    } else {
      this.transport.createRoute(payload).subscribe({ next: (r) => r.success ? done('Route created') : fail(r.message), error: fail });
    }
  }

  cancel(): void { this.router.navigate(['/transport/routes']); }
}
