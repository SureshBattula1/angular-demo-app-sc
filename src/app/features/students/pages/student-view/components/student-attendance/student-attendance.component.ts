import { Component, Input, OnInit, OnChanges, SimpleChanges, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Student } from '../../../../../../core/models/student.model';
import { AttendanceService } from '../../../../../attendance/services/attendance.service';
import { ErrorHandlerService } from '../../../../../../core/services/error-handler.service';
import { AcademicYearContextService } from '../../../../../../core/services/academic-year-context.service';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.scss']
})
export class StudentAttendanceComponent implements OnInit, OnChanges {
  @Input() student?: Student;

  private destroyRef = inject(DestroyRef);
  private academicYearContext = inject(AcademicYearContextService);
  
  isLoading = false;
  attendanceStats = {
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0
  };
  recentAttendance: any[] = [];
  filteredAttendance: any[] = [];
  filterStartDate: Date;
  filterEndDate: Date;
  filterPreset: string = 'this_month';
  statusFilter: string = 'all';

  constructor(
    private attendanceService: AttendanceService,
    private errorHandler: ErrorHandlerService
  ) {
    const now = new Date();
    this.filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  ngOnInit(): void {
    this.loadAttendanceData();
    this.academicYearContext.selectedYearId$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.student?.user_id) {
          this.loadAttendanceData();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student'] && this.student?.user_id) {
      this.loadAttendanceData();
    }
  }

  loadAttendanceData(): void {
    if (!this.student || !this.student.user_id) {
      return;
    }
    
    this.isLoading = true;
    
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);
    
    const userId = this.student.user_id || this.student.id;
    
    this.attendanceService.getStudentAttendance(userId, {
      from_date: fromDate.toISOString().split('T')[0],
      to_date: toDate.toISOString().split('T')[0]
    }).subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          this.recentAttendance = response.data.map((record: any) => ({
            date: record.date,
            dateObj: new Date(record.date),
            status: this.capitalizeStatus(record.status),
            markedBy: record.marked_by || 'System',
            remarks: record.remarks || ''
          }));
          
          this.applyDateFilter();
        } else {
          this.recentAttendance = [];
          this.applyDateFilter();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading attendance data:', error);
        if (error.status !== 404) {
          this.errorHandler.showError('Failed to load attendance data');
        }
        this.recentAttendance = [];
        this.applyDateFilter();
        this.isLoading = false;
      }
    });
  }

  private capitalizeStatus(status: string): string {
    if (!status) return 'Present';
    
    const statusMap: Record<string, string> = {
      'present': 'Present',
      'absent': 'Absent',
      'late': 'Late',
      'excused': 'Excused',
      'Present': 'Present',
      'Absent': 'Absent',
      'Late': 'Late',
      'Excused': 'Excused'
    };
    
    return statusMap[status] || 'Present';
  }

  applyDateFilter(): void {
    if (!this.recentAttendance.length) {
      this.filteredAttendance = [];
      this.calculateStats();
      return;
    }
    
    let filtered = this.recentAttendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= this.filterStartDate && recordDate <= this.filterEndDate;
    });
    
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === this.statusFilter);
    }
    
    this.filteredAttendance = filtered;
    this.calculateStats();
  }

  calculateStats(): void {
    const stats = {
      totalDays: this.filteredAttendance.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      percentage: 0
    };
    
    this.filteredAttendance.forEach(record => {
      switch(record.status) {
        case 'Present': stats.present++; break;
        case 'Absent': stats.absent++; break;
        case 'Late': stats.late++; break;
        case 'Excused': stats.excused++; break;
      }
    });
    
    stats.percentage = stats.totalDays > 0 
      ? parseFloat(((stats.present / stats.totalDays) * 100).toFixed(2))
      : 0;
    
    this.attendanceStats = stats;
  }

  onFilterPresetChange(preset: string): void {
    this.filterPreset = preset;
    const now = new Date();
    
    switch(preset) {
      case 'this_week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        this.filterStartDate = startOfWeek;
        this.filterEndDate = new Date();
        break;
        
      case 'this_month':
        this.filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        this.filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
        
      case 'last_month':
        this.filterStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        this.filterEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
        
      case 'last_3_months':
        this.filterStartDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        this.filterEndDate = new Date();
        break;
        
      case 'custom':
        break;
    }
    
    if (preset !== 'custom') {
      this.applyDateFilter();
    }
  }

  onDateRangeChange(): void {
    this.filterPreset = 'custom';
    this.applyDateFilter();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter = status;
    this.applyDateFilter();
  }

  getAttendanceStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'Present': 'check_circle',
      'Absent': 'cancel',
      'Late': 'schedule',
      'Excused': 'event_available'
    };
    return icons[status] || 'help';
  }

  getMonthsFromAttendance(): any[] {
    if (!this.filteredAttendance || this.filteredAttendance.length === 0) {
      return [];
    }
    
    const monthsMap = new Map<string, any>();
    const today = new Date();
    
    this.filteredAttendance.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          year: date.getFullYear(),
          month: date.getMonth(),
          monthName: date.toLocaleDateString('en-US', { month: 'long' }),
          attendanceMap: new Map(),
          stats: { present: 0, absent: 0, late: 0, excused: 0 }
        });
      }
      
      const monthData = monthsMap.get(monthKey);
      monthData.attendanceMap.set(date.getDate(), record);
      
      switch(record.status) {
        case 'Present': monthData.stats.present++; break;
        case 'Absent': monthData.stats.absent++; break;
        case 'Late': monthData.stats.late++; break;
        case 'Excused': monthData.stats.excused++; break;
      }
    });
    
    return Array.from(monthsMap.values()).map(monthData => {
      const firstDay = new Date(monthData.year, monthData.month, 1);
      const lastDay = new Date(monthData.year, monthData.month + 1, 0);
      const emptyStart = Array(firstDay.getDay()).fill(null);
      
      const days = [];
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const currentDate = new Date(monthData.year, monthData.month, d);
        days.push({
          date: d,
          attendance: monthData.attendanceMap.get(d),
          isToday: currentDate.toDateString() === today.toDateString()
        });
      }
      
      return {
        ...monthData,
        emptyStart,
        days
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  getAttendanceTooltip(day: any): string {
    if (!day.attendance) {
      return day.isToday ? 'Today - No attendance record' : 'No attendance record';
    }
    
    const date = new Date(day.attendance.date);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    let tooltip = `${dateStr}\nStatus: ${day.attendance.status}`;
    
    if (day.attendance.remarks) {
      tooltip += `\nRemarks: ${day.attendance.remarks}`;
    }
    
    if (day.attendance.markedBy) {
      tooltip += `\nMarked by: ${day.attendance.markedBy}`;
    }
    
    return tooltip;
  }
}
