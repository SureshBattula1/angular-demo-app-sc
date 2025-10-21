import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig } from '../../../../shared/components/data-table/data-table.interface';
import { HolidayService } from '../../services/holiday.service';
import { Holiday, CalendarDay } from '../../../../core/models/holiday.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatMenuModule,
    DataTableComponent
  ],
  templateUrl: './holiday-list.component.html',
  styleUrls: ['./holiday-list.component.scss']
})
export class HolidayListComponent implements OnInit {
  @ViewChild(DataTableComponent) dataTable!: DataTableComponent;
  
  // View state
  viewMode: 'calendar' | 'list' = 'calendar';
  
  // Holiday data
  holidays: Holiday[] = [];
  upcomingHolidays: Holiday[] = [];
  loading = false;
  loadingUpcoming = false;
  
  // Calendar state
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth();
  calendarDays: CalendarDay[] = [];
  
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  holidayTypes = [
    { type: 'National', color: '#FF5733', icon: 'flag' },
    { type: 'State', color: '#FFA500', icon: 'location_city' },
    { type: 'Local', color: '#3498DB', icon: 'place' },
    { type: 'Festival', color: '#E91E63', icon: 'celebration' },
    { type: 'Optional', color: '#9C27B0', icon: 'event_available' }
  ];

  tableConfig: TableConfig = {
    columns: [
      { key: 'title', header: 'Holiday Name', sortable: true, searchable: true, width: '25%' },
      { key: 'type', header: 'Type', type: 'badge', sortable: true, width: '12%' },
      { key: 'start_date', header: 'Start Date', type: 'date', sortable: true, width: '12%' },
      { key: 'end_date', header: 'End Date', type: 'date', sortable: true, width: '12%' },
      { key: 'duration', header: 'Days', sortable: true, align: 'center', width: '8%' },
      { key: 'branch', header: 'Branch', sortable: true, width: '15%' },
      { key: 'is_active', header: 'Status', type: 'badge', sortable: true, width: '10%' }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'View Details',
        action: (row: Holiday) => this.viewHoliday(row)
      },
      {
        icon: 'edit',
        label: 'Edit Holiday',
        color: 'primary',
        action: (row: Holiday) => this.editHoliday(row),
        show: (row: Holiday) => this.canEdit(row)
      },
      {
        icon: 'delete',
        label: 'Delete Holiday',
        color: 'warn',
        action: (row: Holiday) => this.deleteHoliday(row),
        show: (row: Holiday) => this.canDelete()
      }
    ],
    pagination: true,
    searchable: true,
    exportable: true,
    responsive: true,
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 10
  };

  constructor(
    private holidayService: HolidayService,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadHolidays();
    this.loadCalendarData();
    this.loadUpcomingHolidays();
  }

  /**
   * Load all holidays
   */
  loadHolidays(): void {
    this.loading = true;
    this.holidayService.getHolidays().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.holidays = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError('Failed to load holidays');
        this.loading = false;
      }
    });
  }

  /**
   * Load calendar data for current month
   */
  loadCalendarData(): void {
    this.loading = true;
    const year = this.currentYear;
    const month = this.currentMonth + 1;

    this.holidayService.getCalendarData(year, month).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.holidays = response.data;
          this.generateCalendar();
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError('Failed to load calendar');
        this.loading = false;
      }
    });
  }

  /**
   * Load upcoming holidays
   */
  loadUpcomingHolidays(): void {
    this.loadingUpcoming = true;
    this.holidayService.getUpcoming(10).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.upcomingHolidays = response.data;
        }
        this.loadingUpcoming = false;
      },
      error: (error) => {
        this.loadingUpcoming = false;
      }
    });
  }

  /**
   * Generate calendar days
   */
  generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayHolidays = this.getHolidaysForDate(date);
      
      days.push({
        date: date,
        number: date.getDate(),
        isCurrentMonth: date.getMonth() === this.currentMonth,
        isToday: this.isSameDay(date, today),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        holidays: dayHolidays
      });
    }
    
    this.calendarDays = days;
  }

  /**
   * Get holidays for a specific date
   */
  getHolidaysForDate(date: Date): Holiday[] {
    return this.holidays.filter(holiday => {
      const start = new Date(holiday.start_date);
      const end = new Date(holiday.end_date);
      
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      return dateOnly >= startOnly && dateOnly <= endOnly;
    });
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Handle table actions
   */
  onAction(event: { action: string, row: Holiday | null }): void {
    if (event.action === 'add') {
      this.addHoliday();
    }
  }

  /**
   * View holiday details
   */
  viewHoliday(holiday: Holiday, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/holidays/view', holiday.id]);
  }

  /**
   * Edit holiday
   */
  editHoliday(holiday: Holiday, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/holidays/edit', holiday.id]);
  }

  /**
   * Delete holiday
   */
  deleteHoliday(holiday: Holiday): void {
    if (confirm(`Are you sure you want to delete "${holiday.title}"?`)) {
      this.holidayService.deleteHoliday(holiday.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Holiday deleted successfully');
            this.loadHolidays();
          }
        },
        error: (error) => {
          this.errorHandler.showError('Failed to delete holiday');
        }
      });
    }
  }


  /**
   * Check if user can edit holiday
   */
  canEdit(holiday: Holiday): boolean {
    const user = this.authService.currentUser();
    if (user?.role === 'SuperAdmin') return true;
    if (user?.role === 'BranchAdmin') {
      return holiday.branch_id === user.branch_id;
    }
    return false;
  }

  /**
   * Check if user can delete
   */
  canDelete(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'SuperAdmin';
  }

  /**
   * Navigate to previous month
   */
  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadCalendarData();
  }

  /**
   * Navigate to next month
   */
  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadCalendarData();
  }

  /**
   * Go to today
   */
  goToToday(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.loadCalendarData();
    this.loadUpcomingHolidays();
  }

  /**
   * Switch view mode
   */
  switchView(mode: 'calendar' | 'list'): void {
    this.viewMode = mode;
    if (mode === 'list') {
      this.loadHolidays();
    }
  }

  /**
   * Handle day click
   */
  onDayClick(day: CalendarDay): void {
    if (day.holidays.length > 0) {
      this.viewHoliday(day.holidays[0]);
    } else if (this.canCreate()) {
      this.addHoliday(day.date);
    }
  }

  /**
   * Add new holiday with optional date
   */
  addHoliday(date?: Date): void {
    if (date) {
      this.router.navigate(['/holidays/create'], {
        queryParams: { date: date.toISOString().split('T')[0] }
      });
    } else {
      this.router.navigate(['/holidays/create']);
    }
  }

  /**
   * Get badge color for holiday type
   */
  getTypeColor(type: string): string {
    const found = this.holidayTypes.find(t => t.type === type);
    return found?.color || '#3498DB';
  }

  /**
   * Get icon for holiday type
   */
  getTypeIcon(type: string): string {
    const found = this.holidayTypes.find(t => t.type === type);
    return found?.icon || 'event';
  }

  /**
   * Format date range
   */
  formatDateRange(holiday: Holiday): string {
    const start = new Date(holiday.start_date);
    const end = new Date(holiday.end_date);
    
    if (this.isSameDay(start, end)) {
      return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  /**
   * Check if user can create holidays
   */
  canCreate(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'SuperAdmin' || user?.role === 'BranchAdmin';
  }

  /**
   * Export holidays
   */
  onExport(format: 'excel' | 'pdf' | 'csv'): void {
    // Show loading message
    this.errorHandler.showInfo(`Exporting holidays as ${format.toUpperCase()}...`);
    
    // Call export service
    this.exportService.export(
      {
        endpoint: '/holidays/export',
        filename: 'holidays'
      },
      {
        format: format,
        filters: {}
      }
    );
  }
}

