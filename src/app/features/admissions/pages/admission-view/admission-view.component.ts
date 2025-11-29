import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AdmissionService, AdmissionApplication } from '../../services/admission.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-admission-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './admission-view.component.html',
  styleUrls: ['./admission-view.component.scss']
})
export class AdmissionViewComponent implements OnInit {
  application?: AdmissionApplication;
  isLoading = true;
  applicationId!: number;
  activeTabIndex = 0; // For mat-tab-group selectedIndex

  constructor(
    private admissionService: AdmissionService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.applicationId = +params['id'];
        this.loadApplication();
      }
    });
  }

  loadApplication(): void {
    this.isLoading = true;
    
    this.admissionService.getApplication(this.applicationId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.application = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
        this.router.navigate(['/admissions']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/admissions/edit', this.applicationId]);
  }

  onBack(): void {
    this.router.navigate(['/admissions']);
  }

  onUpdateStatus(): void {
    // Open dialog to update status
    // For now, navigate to edit
    this.onEdit();
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Applied': 'primary',
      'Shortlisted': 'accent',
      'Rejected': 'warn',
      'Admitted': 'primary',
      'Waitlisted': 'accent'
    };
    return colors[status] || 'primary';
  }

  getFullName(): string {
    if (!this.application) return '';
    return `${this.application.first_name || ''} ${this.application.last_name || ''}`.trim();
  }
}

