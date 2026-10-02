import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { TransportDriver } from '../../../../core/models/transport.model';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './driver-form.component.html',
  styleUrls: ['../vehicle-form/vehicle-form.component.scss']
})
export class DriverFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  branches: Array<{ id: string | number; name: string }> = [];
  private driverId: string | null = null;

  constructor(
    private fb: FormBuilder, private transport: TransportService, private branchService: BranchService,
    private route: ActivatedRoute, private router: Router, private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      branch_id: [null, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      phone: ['', Validators.maxLength(20)],
      license_number: ['', Validators.maxLength(60)],
      license_expiry: [null],
      address: [''],
      is_active: [true]
    });
    this.loadBranches();
    this.driverId = this.route.snapshot.paramMap.get('id');
    if (this.driverId) { this.isEdit = true; this.loadDriver(this.driverId); }
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (res) => { this.branches = (res.success && res.data) ? res.data.map(b => ({ id: b.id, name: b.name })) : []; }, error: () => {}
    });
  }

  private loadDriver(id: string): void {
    this.transport.getDriver(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data as TransportDriver;
          this.form.patchValue({ branch_id: d.branch?.id ?? d.branch_id, name: d.name, phone: d.phone, license_number: d.license_number, license_expiry: d.license_expiry ? new Date(d.license_expiry) : null, address: d.address, is_active: d.is_active });
          this.form.get('branch_id')?.disable();
        }
      }, error: (e) => this.errorHandler.showError(e)
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.getRawValue();
    const done = (m: string) => { this.saving = false; this.errorHandler.showSuccess(m); this.router.navigate(['/transport/drivers']); };
    const fail = (e: unknown) => { this.errorHandler.showError(e); this.saving = false; };
    if (this.isEdit && this.driverId) {
      delete payload.branch_id;
      this.transport.updateDriver(this.driverId, payload).subscribe({ next: (r) => r.success ? done('Driver updated') : fail(r.message), error: fail });
    } else {
      this.transport.createDriver(payload).subscribe({ next: (r) => r.success ? done('Driver created') : fail(r.message), error: fail });
    }
  }

  cancel(): void { this.router.navigate(['/transport/drivers']); }
}
