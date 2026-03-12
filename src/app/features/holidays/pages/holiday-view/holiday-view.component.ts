import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { HolidayService } from '../../services/holiday.service';
import { Holiday } from '../../../../core/models/holiday.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-holiday-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './holiday-view.component.html',
  styleUrls: ['./holiday-view.component.scss']
})
export class HolidayViewComponent implements OnInit {
  holiday: Holiday | null = null;
  loading = false;

  constructor(
    private holidayService: HolidayService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadHoliday(+params['id']);
      }
    });
  }

  loadHoliday(id: number): void {
    this.loading = true;
    this.holidayService.getHoliday(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.holiday = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError('Failed to load holiday');
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (this.holiday) {
      this.router.navigate(['/holidays/edit', this.holiday.id]);
    }
  }

  onDelete(): void {
    if (!this.holiday) return;
    
    if (confirm(`Are you sure you want to delete "${this.holiday.title}"?`)) {
      this.holidayService.deleteHoliday(this.holiday.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Holiday deleted successfully');
            this.router.navigate(['/holidays/calendar']);
          }
        },
        error: (error) => {
          this.errorHandler.showError('Failed to delete holiday');
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/holidays/calendar']);
  }

  canEdit(): boolean {
    if (!this.holiday) return false;
    const user = this.authService.currentUser();
    if (user?.role === 'SuperAdmin') return true;
    if (user?.role === 'BranchAdmin') {
      return this.holiday.branch_id === user.branch_id;
    }
    return false;
  }

  canDelete(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'SuperAdmin';
  }
}

