import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AttendanceService } from '../../services/attendance.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentAttendance, TeacherAttendance } from '../../../../core/models/attendance.model';

@Component({
  selector: 'app-attendance-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './attendance-view.component.html',
  styleUrls: ['./attendance-view.component.scss']
})
export class AttendanceViewComponent implements OnInit {
  loading = false;
  attendanceId?: number;
  studentId?: number;
  teacherId?: number;
  showReport = false;
  reportType: 'student' | 'teacher' = 'student';
  attendance?: StudentAttendance | TeacherAttendance;
  attendanceHistory: any[] = [];
  summary: any = null;
  studentInfo: any = null;
  teacherInfo: any = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.attendanceId = +params['id'];
        
        // Check if we need to show report
        this.route.queryParams.subscribe(queryParams => {
          this.showReport = queryParams['report'] === 'true';
          this.reportType = queryParams['type'] || 'student';
          
          if (this.showReport) {
            if (this.reportType === 'student') {
              this.studentId = this.attendanceId;
              this.loadStudentReport();
            } else {
              this.teacherId = this.attendanceId;
              this.loadTeacherReport();
            }
          } else {
            this.loadAttendance();
          }
        });
      }
    });
  }
  
  loadAttendance(): void {
    if (!this.attendanceId) return;
    
    this.loading = true;
    
    this.attendanceService.getAttendanceById(this.attendanceId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.attendance = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.router.navigate(['/attendance']);
      }
    });
  }
  
  loadStudentReport(): void {
    if (!this.studentId) return;
    
    this.loading = true;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    this.attendanceService.getStudentAttendance(this.studentId, {
      from_date: firstDayOfMonth.toISOString().split('T')[0],
      to_date: now.toISOString().split('T')[0]
    }).subscribe({
      next: (response: any) => {
        
        if (response.success) {
          // Backend returns: { success: true, data: [...], summary: {...}, student: {...} }
          this.attendanceHistory = response.data || [];
          this.summary = response.summary || {
            total_days: 0,
            present: 0,
            absent: 0,
            late: 0,
            leaves: 0,
            percentage: 0
          };
          this.studentInfo = response.student || null;
          
        } else {
          this.attendanceHistory = [];
          this.summary = null;
          this.studentInfo = null;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.attendanceHistory = [];
        this.summary = {
          total_days: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0
        };
      }
    });
  }
  
  loadTeacherReport(): void {
    if (!this.teacherId) return;
    
    this.loading = true;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    this.attendanceService.getTeacherAttendance(this.teacherId, {
      from_date: firstDayOfMonth.toISOString().split('T')[0],
      to_date: now.toISOString().split('T')[0]
    }).subscribe({
      next: (response: any) => {
        
        if (response.success) {
          // Backend returns: { success: true, data: [...], summary: {...}, teacher: {...} }
          this.attendanceHistory = response.data || [];
          this.summary = response.summary || {
            total_days: 0,
            present: 0,
            absent: 0,
            late: 0,
            leaves: 0,
            percentage: 0
          };
          this.teacherInfo = response.teacher || null;
          
        } else {
          this.attendanceHistory = [];
          this.summary = null;
          this.teacherInfo = null;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.attendanceHistory = [];
        this.summary = {
          total_days: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0
        };
      }
    });
  }
  
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Present': 'success',
      'Absent': 'danger',
      'Late': 'warning',
      'Half-Day': 'info',
      'Sick Leave': 'secondary',
      'Leave': 'secondary'
    };
    return colors[status] || 'default';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'Present': 'check_circle',
      'Absent': 'cancel',
      'Late': 'schedule',
      'Half-Day': 'timelapse',
      'Sick Leave': 'local_hospital',
      'Leave': 'event_busy'
    };
    return icons[status] || 'info';
  }
  
  getAttendancePercentage(): number {
    return this.summary?.percentage || 0;
  }
  
  getPercentageColor(): string {
    const percentage = this.getAttendancePercentage();
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'warning';
    return 'danger';
  }
  
  onBack(): void {
    this.router.navigate(['/attendance']);
  }
  
  onEdit(): void {
    if (this.attendanceId) {
      this.router.navigate(['/attendance/edit', this.attendanceId]);
    }
  }
  
  printReport(): void {
    window.print();
  }
  
  exportReport(format: string): void {
    this.errorHandler.showInfo(`Exporting report as ${format.toUpperCase()}...`);
    // Implement export logic
  }
  
  isStudentAttendance(attendance: StudentAttendance | TeacherAttendance): attendance is StudentAttendance {
    return 'student_id' in attendance;
  }
}

