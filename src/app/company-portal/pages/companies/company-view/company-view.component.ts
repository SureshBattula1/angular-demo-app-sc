import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { CompanyService } from '../../../services/company.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Company } from '../../../../core/models/school.model';

@Component({
  selector: 'app-company-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
<div class="view-container" *ngIf="!isLoading && company">
  <div class="view-action-bar">
    <button mat-button (click)="onBack()">
      <mat-icon>arrow_back</mat-icon>
      Back to List
    </button>
    <div class="action-buttons">
      <button mat-raised-button color="primary" (click)="onEdit()">
        <mat-icon>edit</mat-icon>
        Edit
      </button>
      <button mat-raised-button color="warn" (click)="onDelete()">
        <mat-icon>delete</mat-icon>
        Delete
      </button>
    </div>
  </div>
  <mat-card class="view-header-card">
    <mat-card-content>
      <div class="view-header">
        <div class="view-avatar">
          <mat-icon class="avatar-icon">{{ getCompanyIcon() }}</mat-icon>
        </div>
        <div class="view-info">
          <h1 class="view-name">{{ company.name }}</h1>
          <div class="view-meta">
            <span><mat-icon>qr_code</mat-icon> {{ company.code }}</span>
            <span class="status-badge" [class]="getStatusClass(company.status)">
              <mat-icon>circle</mat-icon> {{ company.status }}
            </span>
          </div>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
  <div class="view-stats-grid">
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-icon schools"><mat-icon>school</mat-icon></div>
        <div class="stat-details">
          <div class="stat-value">{{ schoolsCount }}</div>
          <div class="stat-label">Total Schools</div>
          <div class="stat-sub-label" *ngIf="activeSchoolsCount > 0">{{ activeSchoolsCount }} active</div>
        </div>
      </mat-card-content>
    </mat-card>
  </div>
  <div class="view-details-grid">
    <mat-card class="detail-card">
      <mat-card-header>
        <mat-card-title><mat-icon>info</mat-icon> Basic Information</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="detail-row"><span class="detail-label">Company Name:</span><span class="detail-value">{{ company.name }}</span></div>
        <div class="detail-row"><span class="detail-label">Code:</span><span class="detail-value">{{ company.code }}</span></div>
        <div class="detail-row"><span class="detail-label">Status:</span><span class="detail-value">{{ company.status }}</span></div>
        <div class="detail-row" *ngIf="company.created_at"><span class="detail-label">Created:</span><span class="detail-value">{{ company.created_at | date }}</span></div>
      </mat-card-content>
    </mat-card>
    <mat-card class="detail-card">
      <mat-card-header>
        <mat-card-title><mat-icon>contact_phone</mat-icon> Contact Information</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="detail-row"><span class="detail-label">Email:</span><span class="detail-value">{{ company.email }}</span></div>
        <div class="detail-row"><span class="detail-label">Phone:</span><span class="detail-value">{{ company.phone }}</span></div>
        <div class="detail-row" *ngIf="company.website"><span class="detail-label">Website:</span><span class="detail-value"><a [href]="company.website" target="_blank" rel="noopener">{{ company.website }}</a></span></div>
        <div class="detail-row" *ngIf="company.tax_id"><span class="detail-label">Tax ID:</span><span class="detail-value">{{ company.tax_id }}</span></div>
      </mat-card-content>
    </mat-card>
    <mat-card class="detail-card" *ngIf="company.address || company.city || company.country">
      <mat-card-header>
        <mat-card-title><mat-icon>location_on</mat-icon> Address</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="detail-row" *ngIf="company.address"><span class="detail-label">Address:</span><span class="detail-value">{{ company.address }}</span></div>
        <div class="detail-row" *ngIf="company.city"><span class="detail-label">City:</span><span class="detail-value">{{ company.city }}</span></div>
        <div class="detail-row" *ngIf="company.state"><span class="detail-label">State:</span><span class="detail-value">{{ company.state }}</span></div>
        <div class="detail-row" *ngIf="company.country"><span class="detail-label">Country:</span><span class="detail-value">{{ company.country }}</span></div>
        <div class="detail-row" *ngIf="company.pincode"><span class="detail-label">Pincode:</span><span class="detail-value">{{ company.pincode }}</span></div>
      </mat-card-content>
    </mat-card>
    <mat-card class="detail-card" *ngIf="schoolsList.length > 0">
      <mat-card-header>
        <mat-card-title><mat-icon>school</mat-icon> Schools</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="schools-list">
          <div class="school-item" *ngFor="let school of schoolsList">
            <mat-icon>school</mat-icon>
            <div class="school-info">
              <span class="school-name">{{ school.name }}</span>
              <span class="school-code">{{ school.code }}</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
    <mat-card class="detail-card" *ngIf="company.settings && (company.settings | json) !== '{}'">
      <mat-card-header>
        <mat-card-title><mat-icon>settings</mat-icon> Settings</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="settings-display"><pre>{{ company.settings | json }}</pre></div>
      </mat-card-content>
    </mat-card>
  </div>
</div>
<div class="view-loading-container" *ngIf="isLoading">
  <mat-spinner diameter="50"></mat-spinner>
  <p>Loading company details...</p>
</div>
  `,
  styleUrl: './company-view.component.scss'
})
export class CompanyViewComponent implements OnInit {
  company?: Company & { schools?: Array<{ id: number; name: string; code: string; status?: string }> };
  isLoading = true;
  companyId!: string;

  constructor(
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.companyId = params['id'];
        this.loadCompany();
      }
    });
  }

  loadCompany(): void {
    this.isLoading = true;

    this.companyService.getCompany(this.companyId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.company = response.data as Company & { schools?: Array<{ id: number; name: string; code: string; status?: string }> };
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/company-portal/companies']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/company-portal/companies', this.companyId, 'edit']);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete company "${this.company?.name}"? This action cannot be undone.`)) {
      this.companyService.deleteCompany(this.companyId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Company deleted successfully');
            this.router.navigate(['/company-portal/companies']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/company-portal/companies']);
  }

  getStatusClass(status?: string): string {
    const classes: Record<string, string> = {
      'Active': 'status-active',
      'Inactive': 'status-inactive',
      'Suspended': 'status-suspended'
    };
    return status ? classes[status] || '' : '';
  }

  getCompanyIcon(): string {
    return 'business';
  }

  get schoolsCount(): number {
    if (!this.company) return 0;
    if (Array.isArray((this.company as any).schools)) return (this.company as any).schools.length;
    return this.company.schools_count ?? 0;
  }

  get activeSchoolsCount(): number {
    if (!this.company) return 0;
    if (Array.isArray((this.company as any).schools)) {
      return ((this.company as any).schools as Array<{ status?: string }>).filter(s => s.status === 'Active').length;
    }
    return this.company.active_schools_count ?? 0;
  }

  get schoolsList(): Array<{ id: number; name: string; code: string; status?: string }> {
    if (!this.company || !Array.isArray((this.company as any).schools)) return [];
    return (this.company as any).schools;
  }
}
