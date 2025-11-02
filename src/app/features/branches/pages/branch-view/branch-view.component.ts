import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { BranchService } from '../../services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { Branch, BranchStats } from '../../../../core/models/branch.model';
import { environment } from '../../../../../environments/environment';
import { UniversalAttachmentsComponent } from '../../../../shared/components/universal-attachments/universal-attachments.component';

@Component({
  selector: 'app-branch-view',
  standalone: true,
  imports: [CommonModule, MaterialModule, UniversalAttachmentsComponent],
  templateUrl: './branch-view.component.html',
  styleUrls: ['./branch-view.component.scss']
})
export class BranchViewComponent implements OnInit {
  branch?: Branch;
  stats?: BranchStats;
  isLoading = true;
  branchId!: number;

  // Permission checks
  canEdit = false;
  canDelete = false;
  canViewStats = false;

  constructor(
    private branchService: BranchService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private permissionService: PermissionService
  ) {
    // Check permissions
    this.canEdit = this.permissionService.hasPermission('branches.edit');
    this.canDelete = this.permissionService.hasPermission('branches.delete');
    this.canViewStats = this.permissionService.hasPermission('branches.stats');
  }

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
      }
    });
  }

  onEdit(): void {
    if (!this.canEdit) {
      this.errorHandler.showError('You do not have permission to edit branches');
      return;
    }
    this.router.navigate(['/branches/edit', this.branchId]);
  }

  onDelete(): void {
    if (!this.canDelete) {
      this.errorHandler.showError('You do not have permission to delete branches');
      return;
    }
    
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

  /**
   * Get logo URL for display
   */
  getLogoUrl(): string {
    if (!this.branch?.logo) {
      return '';
    }
    
    // If logo path already includes http, return as is
    if (this.branch.logo.startsWith('http://') || this.branch.logo.startsWith('https://')) {
      return this.branch.logo;
    }
    
    // Construct full URL from logo path - storage is served from public directory
    // Remove /api from the base URL for storage
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/storage/${this.branch.logo}`;
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
}

