import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Student } from '../../../../../../core/models/student.model';
import { ExamMarkService, StudentMarksYearBreakdown } from '../../../../../exams/services/exam-mark.service';
import { AttendanceService } from '../../../../../attendance/services/attendance.service';
import { AcademicYearContextService } from '../../../../../../core/services/academic-year-context.service';

export interface MarksOverviewRing {
  percentage: number;
  label: string;
}

export interface AttendanceOverviewRing {
  percentage: number;
  present: number;
  absent: number;
  totalDays: number;
  label: string;
}

export interface AttendanceMonthBreakdown {
  month: string;
  month_label: string;
  absent: number;
  present: number;
  total_days: number;
}

@Component({
  selector: 'app-student-header',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './student-header.component.html',
  styleUrls: ['./student-header.component.scss']
})
export class StudentHeaderComponent implements OnInit, OnChanges {
  @Input() student!: Student;
  @Input() showProfilePicture = false;
  @Input() profilePictureUrl = '';
  @Input() activeMenu: 'info' | 'attendance' | 'leaves' | 'exams' | 'fees' | 'library' = 'info';

  @Output() menuClick = new EventEmitter<'info' | 'attendance' | 'leaves' | 'exams' | 'fees' | 'library'>();
  @Output() imageLoad = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<void>();

  private destroyRef = inject(DestroyRef);
  private academicYearContext = inject(AcademicYearContextService);

  readonly ringRadius = 22;
  readonly ringCircumference = 2 * Math.PI * this.ringRadius;

  overviewLoading = false;
  overallRing: MarksOverviewRing = { percentage: 0, label: 'All years' };
  currentYearMarksRing: MarksOverviewRing = { percentage: 0, label: 'This year' };
  attendanceRing: AttendanceOverviewRing = {
    percentage: 0,
    present: 0,
    absent: 0,
    totalDays: 0,
    label: 'This year'
  };
  yearBreakdown: StudentMarksYearBreakdown[] = [];
  monthBreakdown: AttendanceMonthBreakdown[] = [];

  constructor(
    private examMarkService: ExamMarkService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    this.loadHeaderOverview();
    this.academicYearContext.selectedYearId$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadHeaderOverview());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student'] && this.getStudentUserId()) {
      this.loadHeaderOverview();
    }
  }

  private getStudentUserId(): string | number | null {
    if (!this.student) return null;
    return this.student.user_id || this.student.id || null;
  }

  loadHeaderOverview(): void {
    const userId = this.getStudentUserId();
    if (!userId) return;

    this.overviewLoading = true;
    forkJoin({
      marks: this.examMarkService.getStudentMarksOverview(userId),
      attendance: this.attendanceService.getStudentAttendanceOverview(userId)
    }).subscribe({
      next: ({ marks, attendance }) => {
        if (marks.success && marks.data) {
          const { overall, current_year: currentYearMarks } = marks.data;
          this.overallRing = {
            percentage: overall?.percentage ?? 0,
            label: 'All years'
          };
          const marksYearLabel = currentYearMarks?.academic_year_name
            || this.academicYearContext.selectedYear?.name
            || 'This year';
          this.currentYearMarksRing = {
            percentage: currentYearMarks?.percentage ?? 0,
            label: marksYearLabel
          };
          this.yearBreakdown = marks.data.by_year ?? [];
        }

        if (attendance.success && attendance.data) {
          const currentYear = attendance.data.current_year;
          const yearLabel = currentYear?.academic_year_name
            || this.academicYearContext.selectedYear?.name
            || 'This year';
          this.attendanceRing = {
            percentage: currentYear?.percentage ?? 0,
            present: currentYear?.present ?? 0,
            absent: currentYear?.absent ?? 0,
            totalDays: currentYear?.total_days ?? 0,
            label: yearLabel
          };
          this.monthBreakdown = attendance.data.by_month ?? [];
        }

        this.overviewLoading = false;
      },
      error: () => {
        this.overviewLoading = false;
      }
    });
  }

  calculateStrokeDashoffset(percentage: number): number {
    return this.ringCircumference - (percentage / 100) * this.ringCircumference;
  }

  getRingColor(percentage: number): string {
    if (percentage >= 75) return 'var(--success-color, #4caf50)';
    if (percentage >= 50) return 'var(--warning-color, #ff9800)';
    return 'var(--error-color, #f44336)';
  }

  getAbsentCountColor(absent: number): string {
    if (absent === 0) return 'var(--success-color, #4caf50)';
    if (absent <= 2) return 'var(--warning-color, #ff9800)';
    return 'var(--error-color, #f44336)';
  }

  getFullName(): string {
    if (!this.student) return '';
    const firstName = this.student.user?.first_name || this.student.first_name || '';
    const lastName = this.student.user?.last_name || this.student.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  getGradeLabel(): string {
    if (!this.student?.grade) return '';
    const gradeNumber = parseInt(this.student.grade);
    if (gradeNumber === 1) return `${gradeNumber}st Grade`;
    if (gradeNumber === 2) return `${gradeNumber}nd Grade`;
    if (gradeNumber === 3) return `${gradeNumber}rd Grade`;
    return `${gradeNumber}th Grade`;
  }

  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'Active': 'status-active',
      'Inactive': 'status-inactive',
      'Graduated': 'status-graduated',
      'Transferred': 'status-transferred',
      'Suspended': 'status-suspended',
      'Expelled': 'status-expelled'
    };
    return statusColors[status] || 'status-default';
  }

  onMenuClick(menu: 'info' | 'attendance' | 'leaves' | 'exams' | 'fees' | 'library'): void {
    this.menuClick.emit(menu);
  }

  onImageLoad(): void {
    this.imageLoad.emit();
  }

  onImageError(): void {
    this.imageError.emit();
  }
}
