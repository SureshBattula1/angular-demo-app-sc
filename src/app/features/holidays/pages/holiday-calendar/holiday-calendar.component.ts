import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HolidayService } from '../../services/holiday.service';
import { Holiday, CalendarDay } from '../../../../core/models/holiday.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './holiday-calendar.component.html',
  styleUrls: ['./holiday-calendar.component.scss']
})
export class HolidayCalendarComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth();
  calendarDays: CalendarDay[] = [];
  holidays: Holiday[] = [];
  upcomingHolidays: Holiday[] = [];
  loading = false;
  loadingUpcoming = false;

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  holidayTypes = [
    { type: 'National', color: '#FF5733', label: 'National' },
    { type: 'State', color: '#FFA500', label: 'State' },
    { type: 'School', color: '#3498DB', label: 'School' },
    { type: 'Optional', color: '#9B59B6', label: 'Optional' },
    { type: 'Restricted', color: '#95A5A6', label: 'Restricted' }
  ];

  constructor(
    private holidayService: HolidayService,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    console.log('Holiday Calendar initialized');
    this.loadCalendarData();
    this.loadUpcomingHolidays();
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
        console.log('Calendar API response:', response);
        if (response.success && response.data) {
          this.holidays = response.data;
          console.log(`Loaded ${this.holidays.length} holidays for ${this.monthNames[this.currentMonth]} ${this.currentYear}`);
          this.generateCalendar();
        } else {
          console.warn('No holidays data in response');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading calendar:', error);
        this.errorHandler.showError('Failed to load calendar data');
        this.loading = false;
      }
    });
  }

  /**
   * Load upcoming holidays
   */
  loadUpcomingHolidays(): void {
    this.loadingUpcoming = true;
    this.holidayService.getUpcoming(5).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.upcomingHolidays = response.data;
        }
        this.loadingUpcoming = false;
      },
      error: (error) => {
        console.error('Error loading upcoming holidays:', error);
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
    console.log(`Generated ${days.length} calendar days, ${days.filter(d => d.holidays.length > 0).length} days have holidays`);
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
    this.loadUpcomingHolidays();
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
   * View all holidays as list
   */
  viewList(): void {
    this.router.navigate(['/holidays/list']);
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
   * Get badge color for holiday type
   */
  getTypeColor(type: string): string {
    const found = this.holidayTypes.find(t => t.type === type);
    return found?.color || '#3498DB';
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
}

