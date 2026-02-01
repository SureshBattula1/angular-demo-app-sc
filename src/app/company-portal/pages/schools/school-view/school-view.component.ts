import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { CompanySchoolService } from '../../../services/school.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { School } from '../../../../core/models/school.model';

@Component({
  selector: 'app-school-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './school-view.component.html',
  styleUrl: './school-view.component.scss'
})
export class SchoolViewComponent implements OnInit {
  school?: School;
  stats?: any;
  isLoading = true;
  schoolId!: number;

  constructor(
    private schoolService: CompanySchoolService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.schoolId = +params['id'];
        this.loadSchool();
        this.loadStats();
      }
    });
  }

  loadSchool(): void {
    this.isLoading = true;
    
    this.schoolService.getSchool(this.schoolId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.school = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/company-portal/schools']);
      }
    });
  }

  loadStats(): void {
    this.schoolService.getSchoolStatistics(this.schoolId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        // Stats are optional, don't show error
        console.error('Failed to load school statistics:', error);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/company-portal/schools', this.schoolId, 'edit']);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete school "${this.school?.name}"? This action cannot be undone.`)) {
      this.schoolService.deleteSchool(this.schoolId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('School deleted successfully');
            this.router.navigate(['/company-portal/schools']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/company-portal/schools']);
  }

  toggleStatus(): void {
    if (this.school?.status === 'Active') {
      this.schoolService.deactivateSchool(this.schoolId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('School deactivated');
            this.loadSchool();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    } else {
      this.schoolService.activateSchool(this.schoolId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('School activated');
            this.loadSchool();
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  getStatusClass(status?: string): string {
    const classes: Record<string, string> = {
      'Active': 'status-active',
      'Inactive': 'status-inactive',
      'Suspended': 'status-suspended',
      'UnderConstruction': 'status-construction'
    };
    return status ? classes[status] || '' : '';
  }

  getSchoolIcon(): string {
    return 'school';
  }
}
