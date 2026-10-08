import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Vehicle, TransportDriver, TransportRoute } from '../../../../core/models/transport.model';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.scss']
})
export class VehicleFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  branches: Array<{ id: string | number; name: string }> = [];
  drivers: TransportDriver[] = [];
  routes: TransportRoute[] = [];
  private vehicleId: string | null = null;

  constructor(
    private fb: FormBuilder, private transport: TransportService, private branchService: BranchService,
    private route: ActivatedRoute, private router: Router, private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      branch_id: [null, Validators.required],
      vehicle_number: ['', [Validators.required, Validators.maxLength(50)]],
      vehicle_type: ['Bus', Validators.required],
      make: [''],
      model: [''],
      capacity: [30, [Validators.required, Validators.min(1)]],
      insurance_expiry: [null],
      fitness_expiry: [null],
      transport_driver_id: [null],
      route_id: [null],
      status: ['Active']
    });
    this.loadBranches();
    this.loadDrivers();
    this.loadRoutes();
    this.vehicleId = this.route.snapshot.paramMap.get('id');
    if (this.vehicleId) { this.isEdit = true; this.loadVehicle(this.vehicleId); }
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({ next: (res) => { this.branches = (res.success && res.data) ? res.data.map(b => ({ id: b.id, name: b.name })) : []; }, error: () => {} });
  }
  private loadDrivers(): void {
    this.transport.getDrivers({ per_page: 200 }).subscribe({ next: (res) => { this.drivers = res.data || []; }, error: () => {} });
  }
  private loadRoutes(): void {
    this.transport.getRoutes({ per_page: 200 }).subscribe({ next: (res) => { this.routes = res.data || []; }, error: () => {} });
  }

  private loadVehicle(id: string): void {
    this.transport.getVehicle(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const v = res.data as Vehicle;
          this.form.patchValue({
            branch_id: v.branch?.id ?? v.branch_id, vehicle_number: v.vehicle_number, vehicle_type: v.vehicle_type,
            make: v.make, model: v.model, capacity: v.capacity,
            insurance_expiry: v.insurance_expiry ? new Date(v.insurance_expiry) : null,
            fitness_expiry: v.fitness_expiry ? new Date(v.fitness_expiry) : null,
            transport_driver_id: v.driver?.id ?? v.transport_driver_id, route_id: v.route?.id ?? v.route_id, status: v.status
          });
          this.form.get('branch_id')?.disable();
        }
      }, error: (e) => this.errorHandler.showError(e)
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.getRawValue();
    const done = (m: string) => { this.saving = false; this.errorHandler.showSuccess(m); this.router.navigate(['/transport/vehicles']); };
    const fail = (e: unknown) => { this.errorHandler.showError(e); this.saving = false; };
    if (this.isEdit && this.vehicleId) {
      delete payload.branch_id;
      this.transport.updateVehicle(this.vehicleId, payload).subscribe({ next: (r) => r.success ? done('Vehicle updated') : fail(r.message), error: fail });
    } else {
      this.transport.createVehicle(payload).subscribe({ next: (r) => r.success ? done('Vehicle created') : fail(r.message), error: fail });
    }
  }

  cancel(): void { this.router.navigate(['/transport/vehicles']); }
}
