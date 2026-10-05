import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { TransportStopMaster } from '../../../../core/models/transport.model';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-stop-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './stop-list.component.html',
  styleUrls: ['./stop-list.component.scss']
})
export class StopListComponent implements OnInit {
  loading = false;
  saving = false;
  stops: TransportStopMaster[] = [];
  filteredStops: TransportStopMaster[] = [];
  searchQuery = '';
  branches: { id: string | number; name: string }[] = [];

  modalVisible = false;
  editingStopId: string | number | null = null;
  form: Partial<TransportStopMaster> = {
    branch_id: '',
    stop_name: '',
    landmark: '',
    latitude: null,
    longitude: null,
    geofence_radius: 50
  };

  constructor(
    private transport: TransportService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadStops();
  }

  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (res) => {
        this.branches = (res.data || []).map((b) => ({ id: b.id, name: b.name }));
        if (this.branches.length > 0 && !this.form.branch_id) {
          this.form.branch_id = this.branches[0].id;
        }
      },
      error: () => {}
    });
  }

  loadStops(): void {
    this.loading = true;
    this.transport.getStops({ per_page: 200 }).subscribe({
      next: (res) => {
        this.stops = res.data || [];
        this.filterStops();
        this.loading = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loading = false;
      }
    });
  }

  filterStops(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredStops = [...this.stops];
      return;
    }
    this.filteredStops = this.stops.filter((s) =>
      s.stop_name.toLowerCase().includes(q) ||
      (s.landmark && s.landmark.toLowerCase().includes(q))
    );
  }

  openCreateModal(): void {
    this.editingStopId = null;
    this.form = {
      branch_id: this.branches[0]?.id || '',
      stop_name: '',
      landmark: '',
      latitude: null,
      longitude: null,
      geofence_radius: 50
    };
    this.modalVisible = true;
  }

  openEditModal(s: TransportStopMaster): void {
    this.editingStopId = s.id;
    this.form = {
      branch_id: s.branch_id || this.branches[0]?.id || '',
      stop_name: s.stop_name,
      landmark: s.landmark,
      latitude: s.latitude,
      longitude: s.longitude,
      geofence_radius: s.geofence_radius || 50
    };
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
  }

  saveStop(): void {
    if (!this.form.stop_name) return;
    this.saving = true;

    if (this.editingStopId) {
      this.transport.updateStop(this.editingStopId, this.form).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.errorHandler.showSuccess('Stop updated successfully');
            this.closeModal();
            this.loadStops();
          } else {
            this.errorHandler.showError(res.message || 'Failed to update stop');
          }
        },
        error: (e) => {
          this.errorHandler.showError(e);
          this.saving = false;
        }
      });
    } else {
      this.transport.createStop(this.form).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.errorHandler.showSuccess('Stop created successfully');
            this.closeModal();
            this.loadStops();
          } else {
            this.errorHandler.showError(res.message || 'Failed to create stop');
          }
        },
        error: (e) => {
          this.errorHandler.showError(e);
          this.saving = false;
        }
      });
    }
  }

  deleteStop(s: TransportStopMaster): void {
    if (!confirm(`Delete transit stop "${s.stop_name}"?`)) return;
    this.transport.deleteStop(s.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorHandler.showSuccess('Stop deleted');
          this.loadStops();
        } else {
          this.errorHandler.showError(res.message || 'Failed to delete stop');
        }
      },
      error: (e) => this.errorHandler.showError(e)
    });
  }
}
