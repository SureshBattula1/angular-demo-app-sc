import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { StudentCrudService } from '../../services/student-crud.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Student } from '../../../../core/models/student.model';
import { AttendanceService } from '../../../attendance/services/attendance.service';

@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './student-view.component.html',
  styleUrls: ['./student-view.component.scss']
})
export class StudentViewComponent implements OnInit {
  student?: Student;
  isLoading = true;
  studentId!: number;
  
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
  statusFilter: string = 'all'; // Default to show all statuses
  
  // View mode for attendance records
  viewMode: 'list' | 'grid' = 'list';
  
  // Chart data
  chartData: any[] = [];
  chartLabels: string[] = [];

  constructor(
    private studentCrudService: StudentCrudService,
    private attendanceService: AttendanceService,
    private route: ActivatedRoute,
    private router: Router,
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
        this.studentId = +params['id'];
        this.loadStudent();
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

  loadStudent(): void {
    this.isLoading = true;
    
    this.studentCrudService.getStudent(this.studentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.student = response.data;
          this.isLoading = false;
          
          // Load attendance after student data is loaded
          // This ensures we have the user_id available
          if (this.selectedTabIndex === 1) {
            this.loadAttendanceData();
          }
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/students']);
      }
    });
  }

  getGradeLabel(): string {
    return this.student?.grade_label || `Grade ${this.student?.grade}` || 'N/A';
  }

  onEdit(): void {
    this.router.navigate(['/students/edit', this.studentId]);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete student "${this.student?.first_name} ${this.student?.last_name}"?`)) {
      this.studentCrudService.deleteStudent(this.studentId).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Student deleted successfully');
            this.router.navigate(['/students']);
          }
        },
        error: (error) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/students']);
  }

  getFullName(): string {
    return `${this.student?.first_name || ''} ${this.student?.last_name || ''}`.trim();
  }

  getAge(): number {
    if (!this.student?.date_of_birth) return 0;
    const dob = new Date(this.student.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Active': 'primary',
      'Graduated': 'accent',
      'Left': 'warn',
      'Suspended': 'warn',
      'Expelled': 'warn'
    };
    return colors[status] || 'primary';
  }
  
  loadAttendanceData(): void {
    // Need to wait until student data is loaded to get user_id
    if (!this.student || !this.student.user_id) {
      console.log('Waiting for student data to load before fetching attendance...');
      return;
    }
    
    this.attendanceLoading = true;
    
    // Calculate date range for last 90 days
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);
    
    // IMPORTANT: Use user_id, not student table id
    // student_attendance.student_id references users.id, not students.id
    const userId = this.student.user_id || this.student.id;
    
    console.log(`Fetching attendance for student user_id: ${userId}`);
    
    // Call real API to fetch student attendance
    this.attendanceService.getStudentAttendance(userId, {
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
          
          console.log(`Loaded ${this.recentAttendance.length} attendance records for student`);
          
          // Apply initial filter
          this.applyDateFilter();
        } else {
          // If no data, set empty array
          console.log('No attendance data available for this student');
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
    
    // Calculate stats for filtered data
    this.calculateStats();
    
    // Prepare chart data
    this.prepareChartData();
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
  
  prepareChartData(): void {
    // Count by status
    const statusCount: any = {
      'Present': 0,
      'Absent': 0,
      'Late': 0,
      'Excused': 0
    };
    
    this.filteredAttendance.forEach(record => {
      statusCount[record.status]++;
    });
    
    this.chartData = [
      { name: 'Present', value: statusCount['Present'], color: '#4caf50' },
      { name: 'Absent', value: statusCount['Absent'], color: '#f44336' },
      { name: 'Late', value: statusCount['Late'], color: '#ff9800' },
      { name: 'Excused', value: statusCount['Excused'], color: '#2196f3' }
    ];
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
        // Keep current dates
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
    this.applyDateFilter(); // Reapply filters with status
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
  
  canEdit(): boolean {
    // Add your permission logic here
    // For now, return true for demonstration
    return true;
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

