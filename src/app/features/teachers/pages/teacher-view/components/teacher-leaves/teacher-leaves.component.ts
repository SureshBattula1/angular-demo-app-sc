import { Component, Input, OnInit, OnChanges, SimpleChanges, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Teacher } from '../../../../../../core/models/teacher.model';
import { LeaveService } from '../../../../../leaves/services/leave.service';
import { Leave, LeaveSummary } from '../../../../../../core/models/leave.model';
import { ErrorHandlerService } from '../../../../../../core/services/error-handler.service';
import { AcademicYearContextService } from '../../../../../../core/services/academic-year-context.service';

@Component({
  selector: 'app-teacher-leaves',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './teacher-leaves.component.html',
  styleUrls: ['./teacher-leaves.component.scss']
})
export class TeacherLeavesComponent implements OnInit, OnChanges {
  @Input() teacher?: Teacher;

  private destroyRef = inject(DestroyRef);
  private academicYearContext = inject(AcademicYearContextService);

  teacherLeaves: Leave[] = [];
  leavesSummary?: LeaveSummary;
  isLoading = false;

  constructor(
    private leaveService: LeaveService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadLeavesData();
    // Reload when the toolbar academic year changes (teacher leaves are year-scoped server-side).
    this.academicYearContext.selectedYearId$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.teacher?.user_id) {
          this.loadLeavesData();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teacher'] && this.teacher?.user_id) {
      this.loadLeavesData();
    }
  }

  loadLeavesData(): void {
    if (!this.teacher || !this.teacher.user_id) {
      return;
    }
    
    this.isLoading = true;
    const userId = this.teacher.user_id || this.teacher.id;
    
    this.leaveService.getTeacherLeaves(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.teacherLeaves = response.data as Leave[] || [];
          this.leavesSummary = response.summary;
        } else {
          this.teacherLeaves = [];
          this.leavesSummary = undefined;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leaves data:', error);
        if (error.status !== 404) {
          this.errorHandler.showError('Failed to load leave data');
        }
        this.teacherLeaves = [];
        this.leavesSummary = undefined;
        this.isLoading = false;
      }
    });
  }

  getLeaveStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Pending': '#ff9800',
      'Approved': '#4caf50',
      'Rejected': '#f44336',
      'Cancelled': '#9e9e9e'
    };
    return colors[status] || '#9e9e9e';
  }
}

