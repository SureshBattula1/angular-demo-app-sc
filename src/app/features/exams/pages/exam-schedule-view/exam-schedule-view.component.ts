import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamScheduleService } from '../../services/exam-schedule.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-exam-schedule-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './exam-schedule-view.component.html',
  styleUrls: ['./exam-schedule-view.component.scss']
})
export class ExamScheduleViewComponent implements OnInit {
  schedule: any = null;
  loading = false;
  scheduleId?: number;
  returnTab?: string;

  constructor(
    private examScheduleService: ExamScheduleService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.scheduleId = +params['id'];
        this.loadSchedule();
      }
    });
    
    // Capture returnTab from query parameters
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'];
    });
  }

  loadSchedule(): void {
    if (!this.scheduleId) return;
    
    this.loading = true;
    this.examScheduleService.getSchedule(this.scheduleId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.schedule = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (this.scheduleId) {
      this.router.navigate(['/exams/schedule/edit', this.scheduleId], {
        queryParams: { returnTab: this.returnTab }
      });
    }
  }

  onDelete(): void {
    if (!this.scheduleId) return;
    
    if (confirm('Are you sure you want to delete this exam schedule?')) {
      this.examScheduleService.deleteSchedule(this.scheduleId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Exam schedule deleted successfully');
            this.router.navigate(['/exams'], { queryParams: { tab: this.returnTab } });
          }
        },
        error: (error) => this.errorHandler.showError(error)
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/exams'], { queryParams: { tab: this.returnTab } });
  }

  /** Class name for display (e.g. "Grade 5") */
  getClassDisplay(): string {
    const grade = this.schedule?.grade || this.schedule?.grade_level;
    return grade ? `Grade ${grade}` : 'Not specified';
  }

  /** Section name for display */
  getSectionDisplay(): string {
    const section = this.schedule?.section;
    if (section === null || section === undefined || String(section).trim() === '') {
      return 'All Sections';
    }
    return String(section).trim();
  }

}

