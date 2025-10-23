import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { StudentCrudService } from '../../services/student-crud.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Student } from '../../../../core/models/student.model';

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
    this.attendanceLoading = true;
    
    // Simulate attendance data loading
    // In production, replace with actual API call
    setTimeout(() => {
      // Mock recent attendance records
      this.recentAttendance = this.generateMockAttendance();
      
      // Apply initial filter
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
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // More present days than absent
      const rand = Math.random();
      let status = 'Present';
      if (rand < 0.05) status = 'Absent';
      else if (rand < 0.08) status = 'Late';
      else if (rand < 0.10) status = 'Excused';
      
      attendance.push({
        date: date.toISOString().split('T')[0],
        dateObj: date,
        status: status,
        markedBy: 'System',
        remarks: status === 'Absent' ? 'Not present' : status === 'Late' ? 'Arrived late' : ''
      });
    }
    
    return attendance.reverse(); // Oldest first
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

