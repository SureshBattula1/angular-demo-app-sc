import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TeacherService } from '../../services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Teacher } from '../../../../core/models/teacher.model';

@Component({
  selector: 'app-teacher-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './teacher-view.component.html',
  styleUrls: ['./teacher-view.component.scss']
})
export class TeacherViewComponent implements OnInit {
  teacher: Teacher | null = null;
  isLoading = false;
  teacherId!: number;
  
  // Tab management
  selectedTabIndex = 0;
  
  // Attendance data
  attendanceStats = {
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0
  };
  attendanceLoading = false;
  recentAttendance: any[] = [];
  filteredAttendance: any[] = [];
  
  // Date filters
  filterStartDate: Date;
  filterEndDate: Date;
  filterPreset: string = 'this_month';
  
  // Status filter
  statusFilter: string = 'all';
  
  // View mode
  viewMode: 'list' | 'grid' = 'list';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private errorHandler: ErrorHandlerService
  ) {
    // Initialize date filters to current month
    const now = new Date();
    this.filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.teacherId = +params['id'];
        this.loadTeacher();
        this.loadAttendanceData();
      }
    });
  }
  
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    
    // Load attendance data when tab is selected
    if (index === 1 && this.recentAttendance.length === 0) {
      this.loadAttendanceData();
    }
  }

  loadTeacher(): void {
    this.isLoading = true;
    
    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teacher = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/teachers']);
      }
    });
  }

  getFullName(): string {
    if (!this.teacher) return '';
    const firstName = this.teacher.user?.first_name || this.teacher.first_name || '';
    const lastName = this.teacher.user?.last_name || this.teacher.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  getAge(): number {
    if (!this.teacher?.date_of_birth) return 0;
    const today = new Date();
    const birthDate = new Date(this.teacher.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getYearsOfService(): number {
    if (!this.teacher?.joining_date) return 0;
    const today = new Date();
    const joiningDate = new Date(this.teacher.joining_date);
    let years = today.getFullYear() - joiningDate.getFullYear();
    const monthDiff = today.getMonth() - joiningDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joiningDate.getDate())) {
      years--;
    }
    return years;
  }

  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'Active': 'status-active',
      'OnLeave': 'status-warning',
      'Resigned': 'status-info',
      'Retired': 'status-info',
      'Terminated': 'status-danger'
    };
    return statusColors[status] || 'status-default';
  }

  getCategoryColor(category: string): string {
    return category === 'Teaching' ? 'category-teaching' : 'category-non-teaching';
  }

  onBack(): void {
    this.router.navigate(['/teachers']);
  }

  onEdit(): void {
    this.router.navigate(['/teachers/edit', this.teacherId]);
  }

  onDelete(): void {
    const teacherName = this.getFullName();
    if (confirm(`Are you sure you want to delete teacher "${teacherName}"?`)) {
      this.teacherService.deleteTeacher(this.teacherId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Teacher deleted successfully');
            this.router.navigate(['/teachers']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }
  
  // Attendance Analytics Methods
  loadAttendanceData(): void {
    this.attendanceLoading = true;
    setTimeout(() => {
      this.recentAttendance = this.generateMockAttendance();
      this.applyDateFilter();
      this.attendanceLoading = false;
    }, 500);
  }
  
  generateMockAttendance(): any[] {
    const statuses = ['Present', 'Absent', 'Late', 'Excused'];
    const attendance = [];
    const today = new Date();
    
    // Generate last 90 days of data
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
      
      const rand = Math.random();
      let status = 'Present';
      if (rand < 0.02) status = 'Absent';
      else if (rand < 0.05) status = 'Late';
      else if (rand < 0.07) status = 'Excused';
      
      attendance.push({
        date: date.toISOString().split('T')[0],
        dateObj: date,
        status: status,
        markedBy: 'Admin',
        remarks: status === 'Absent' ? 'Sick leave' : status === 'Late' ? 'Traffic delay' : ''
      });
    }
    return attendance.reverse();
  }
  
  applyDateFilter(): void {
    if (!this.recentAttendance.length) return;
    
    // First filter by date range
    let filtered = this.recentAttendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= this.filterStartDate && recordDate <= this.filterEndDate;
    });
    
    // Then filter by status if not 'all'
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === this.statusFilter);
    }
    
    this.filteredAttendance = filtered;
    
    this.calculateStats();
  }
  
  calculateStats(): void {
    const stats = {
      totalDays: this.filteredAttendance.length,
      present: 0, absent: 0, late: 0, excused: 0, percentage: 0
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
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        this.filterStartDate = firstDayOfWeek;
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
        return;
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
  
  canEdit(): boolean {
    return true;
  }
  
  getAttendanceStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Present': 'success',
      'Absent': 'warn',
      'Late': 'accent',
      'Excused': 'primary'
    };
    return colors[status] || 'primary';
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
  
  // Generate monthly calendars from attendance data
  getMonthsFromAttendance(): any[] {
    if (!this.filteredAttendance || this.filteredAttendance.length === 0) {
      return [];
    }
    
    // Group attendance by month
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
      
      // Update stats
      switch(record.status) {
        case 'Present': monthData.stats.present++; break;
        case 'Absent': monthData.stats.absent++; break;
        case 'Late': monthData.stats.late++; break;
        case 'Excused': monthData.stats.excused++; break;
      }
    });
    
    // Convert to array and generate calendar data
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
      // Sort by year and month (newest first)
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }
  
  // Get tooltip text for a day
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
