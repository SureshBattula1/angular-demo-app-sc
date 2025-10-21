import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig } from '../../../../shared/components/data-table/data-table.interface';
import { HolidayService } from '../../services/holiday.service';
import { Holiday, CalendarDay } from '../../../../core/models/holiday.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-holiday-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    DataTableComponent
  ],
  templateUrl: './holiday-calendar.component.html',
  styleUrls: ['./holiday-calendar.component.scss']
})
export class HolidayCalendarComponent implements OnInit {
  @ViewChild(DataTableComponent) dataTable!: DataTableComponent;
  
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth();
  calendarDays: CalendarDay[] = [];
  holidays: Holiday[] = [];
  allHolidays: Holiday[] = [];
  loading = false;
  loadingList = false;

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  holidayTypes = [
    { type: 'National', color: '#FF5733', icon: 'flag', label: 'National' },
    { type: 'State', color: '#FFA500', icon: 'location_city', label: 'State' },
    { type: 'Local', color: '#3498DB', icon: 'place', label: 'Local' },
    { type: 'Festival', color: '#E91E63', icon: 'celebration', label: 'Festival' },
    { type: 'Optional', color: '#9B59B6', icon: 'event_available', label: 'Optional' }
  ];

  // Table configuration
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
    defaultPageSize: 25
  };

  constructor(
    private holidayService: HolidayService,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadCalendarData();
    this.loadAllHolidays();
  }

  /**
   * Load calendar data for current month
   */
  loadCalendarData(): void {
    this.loading = true;
    const year = this.currentYear;
    const month = this.currentMonth + 1; // API expects 1-12

    this.holidayService.getCalendarData(year, month).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.holidays = response.data;
          this.generateCalendar();
        } else {
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError('Failed to load calendar data');
        this.loading = false;
      }
    });
  }

  /**
   * Load all holidays for the list view
   */
  loadAllHolidays(): void {
    this.loadingList = true;
    this.holidayService.getHolidays().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allHolidays = response.data;
        }
        this.loadingList = false;
      },
      error: (error) => {
        this.errorHandler.showError('Failed to load holidays');
        this.loadingList = false;
      }
    });
  }

  /**
   * Generate calendar days
   */
  generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    // Start from Sunday of the first week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Generate 42 days (6 weeks)
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
      
      // Set all times to midnight for proper date comparison
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
  }

  /**
   * Handle day click
   */
  onDayClick(day: CalendarDay): void {
    if (day.holidays.length > 0) {
      // View first holiday
      this.viewHoliday(day.holidays[0]);
    } else if (this.canCreate()) {
      // Add new holiday on this date
      this.addHoliday(day.date);
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
   * Add new holiday
   */
  addHoliday(date?: Date): void {
    if (date) {
      // Navigate with date query param
      this.router.navigate(['/holidays/create'], {
        queryParams: { date: date.toISOString().split('T')[0] }
      });
    } else {
      this.router.navigate(['/holidays/create']);
    }
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
   * Delete holiday
   */
  deleteHoliday(holiday: Holiday): void {
    if (confirm(`Are you sure you want to delete "${holiday.title}"?`)) {
      this.holidayService.deleteHoliday(holiday.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Holiday deleted successfully');
            this.loadCalendarData();
            this.loadAllHolidays();
          }
        },
        error: (error) => {
          this.errorHandler.showError('Failed to delete holiday');
        }
      });
    }
  }

  /**
   * Check if user can create holidays
   */
  canCreate(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'SuperAdmin' || user?.role === 'BranchAdmin';
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
      return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  /**
   * Export holidays
   */
  onExport(format: 'excel' | 'pdf' | 'csv'): void {
    this.errorHandler.showInfo(`Exporting holidays as ${format.toUpperCase()}...`);
    
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

