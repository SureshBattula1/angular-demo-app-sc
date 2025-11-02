import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TeacherService } from '../../services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { Teacher } from '../../../../core/models/teacher.model';
import { AttendanceService } from '../../../attendance/services/attendance.service';
import { LeaveService } from '../../../leaves/services/leave.service';
import { Leave, LeaveSummary } from '../../../../core/models/leave.model';
import { UniversalAttachmentsComponent } from '../../../../shared/components/universal-attachments/universal-attachments.component';

@Component({
  selector: 'app-teacher-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, UniversalAttachmentsComponent],
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

  // Leaves data
  teacherLeaves: Leave[] = [];
  leavesSummary?: LeaveSummary;
  leavesLoading = false;

  // Permission checks
  hasEditPermission = false;
  hasDeletePermission = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private attendanceService: AttendanceService,
    private leaveService: LeaveService,
    private errorHandler: ErrorHandlerService,
    private permissionService: PermissionService
  ) {
    // Initialize date filters to current month
    const now = new Date();
    this.filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Check permissions
    this.hasEditPermission = this.permissionService.hasPermission('teachers.edit');
    this.hasDeletePermission = this.permissionService.hasPermission('teachers.delete');
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
    
    // Load attendance data when tab is selected (index 1)
    if (index === 1 && this.recentAttendance.length === 0) {
      this.loadAttendanceData();
    }
    
    // Load leaves data when tab is selected (index 2)
    if (index === 2 && this.teacherLeaves.length === 0) {
      this.loadLeavesData();
    }
  }

  loadTeacher(): void {
    this.isLoading = true;
    
    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teacher = response.data;
          this.isLoading = false;
          
          // Load attendance after teacher data is loaded
          // This ensures we have the user_id available
          if (this.selectedTabIndex === 1) {
            this.loadAttendanceData();
          }
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
    if (!this.hasEditPermission) {
      this.errorHandler.showError('You do not have permission to edit teachers');
      return;
    }
    this.router.navigate(['/teachers/edit', this.teacherId]);
  }

  onDelete(): void {
    if (!this.hasDeletePermission) {
      this.errorHandler.showError('You do not have permission to delete teachers');
      return;
    }
    
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
    // Need to wait until teacher data is loaded to get user_id
    if (!this.teacher || !this.teacher.user_id) {

      return;
    }
    
    this.attendanceLoading = true;
    
    // Calculate date range for last 90 days
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);
    
    // IMPORTANT: Use user_id, not teacher table id
    // teacher_attendance.teacher_id references users.id, not teachers.id
    const userId = this.teacher.user_id || this.teacher.user?.id;
    
    if (!userId) {
      console.error('Teacher user_id not found');
      this.attendanceLoading = false;
      return;
    }
    

    
    // Call real API to fetch teacher attendance
    this.attendanceService.getTeacherAttendance(userId, {
      from_date: fromDate.toISOString().split('T')[0],
      to_date: toDate.toISOString().split('T')[0]
    }).subscribe({
      next: (response) => {
        // Backend returns: { success: true, data: [...], summary: {...} }
        // So response.data is the attendance array directly
        if (response.success && response.data && Array.isArray(response.data)) {
          // Map API response to component format
          this.recentAttendance = response.data.map((record: any) => ({
            date: record.date,
            dateObj: new Date(record.date),
            status: this.capitalizeStatus(record.status),
            markedBy: record.marked_by || 'System',
            remarks: record.remarks || ''
          }));
          

          
          // Apply initial filter
          this.applyDateFilter();
        } else {
          // If no data, set empty array

          this.recentAttendance = [];
          this.applyDateFilter();
        }
        this.attendanceLoading = false;
      },
      error: (error) => {
        console.error('Error loading attendance data:', error);
        // Don't show error toast if it's just missing data
        if (error.status !== 404) {
          this.errorHandler.showError('Failed to load attendance data');
        }
        this.recentAttendance = [];
        this.applyDateFilter();
        this.attendanceLoading = false;
      }
    });
  }
  
  /**
   * Capitalize status for consistency with UI
   */
  private capitalizeStatus(status: string): string {
    if (!status) return 'Present';
    
    // Map backend status to frontend display format
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

  /**
   * Load leaves data for the teacher
   */
  loadLeavesData(): void {
    if (!this.teacher || !this.teacher.user_id) {

      return;
    }
    
    this.leavesLoading = true;
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
        this.leavesLoading = false;
      },
      error: (error) => {
        console.error('Error loading leaves data:', error);
        if (error.status !== 404) {
          this.errorHandler.showError('Failed to load leave data');
        }
        this.teacherLeaves = [];
        this.leavesSummary = undefined;
        this.leavesLoading = false;
      }
    });
  }

  /**
   * Get leave status color
   */
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
