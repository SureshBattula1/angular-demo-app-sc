import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { BranchService } from '../../services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Branch, BranchStats } from '../../../../core/models/branch.model';

@Component({
  selector: 'app-branch-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './branch-view.component.html',
  styleUrls: ['./branch-view.component.scss']
})
export class BranchViewComponent implements OnInit {
  branch?: Branch;
  stats?: BranchStats;
  isLoading = true;
  branchId!: number;

  constructor(
    private branchService: BranchService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.branchId = +params['id'];
        this.loadBranch();
        this.loadStats();
      }
    });
  }

  loadBranch(): void {
    this.isLoading = true;
    
    this.branchService.getBranch(this.branchId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branch = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/branches']);
      }
    });
  }

  loadStats(): void {
    this.branchService.getBranchStats(this.branchId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/branches/edit', this.branchId]);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete branch "${this.branch?.name}"?`)) {
      this.branchService.deleteBranch(this.branchId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Branch deleted successfully');
            this.router.navigate(['/branches']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/branches']);
  }

  toggleStatus(): void {
    this.branchService.toggleStatus(this.branchId).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Branch status updated');
          this.loadBranch();
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
      }
    });
  }

  getStatusClass(status?: string): string {
    const classes: Record<string, string> = {
      'Active': 'status-active',
      'Inactive': 'status-inactive',
      'UnderConstruction': 'status-construction',
      'Maintenance': 'status-maintenance',
      'Closed': 'status-closed'
    };
    return status ? classes[status] || '' : '';
  }

  getBranchTypeIcon(type?: string): string {
    const icons: Record<string, string> = {
      'HeadOffice': 'corporate_fare',
      'RegionalOffice': 'domain',
      'School': 'school',
      'Campus': 'apartment',
      'SubBranch': 'store'
    };
    return type ? icons[type] || 'business' : 'business';
  }
}

