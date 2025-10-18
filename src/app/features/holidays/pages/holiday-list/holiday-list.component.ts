import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig } from '../../../../shared/components/data-table/data-table.interface';
import { HolidayService } from '../../services/holiday.service';
import { Holiday } from '../../../../core/models/holiday.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DataTableComponent
  ],
  template: `
    <app-data-table
      [data]="holidays"
      [config]="tableConfig"
      [title]="'Holiday Management'"
      [loading]="loading"
      (actionClicked)="onAction($event)">
    </app-data-table>
  `,
  styles: [`:host { display: block; }`]
})
export class HolidayListComponent implements OnInit {
  @ViewChild(DataTableComponent) dataTable!: DataTableComponent;
  
  holidays: Holiday[] = [];
  loading = false;

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
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadHolidays();
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
        console.error('Error loading holidays:', error);
        this.errorHandler.showError('Failed to load holidays');
        this.loading = false;
      }
    });
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
  viewHoliday(holiday: Holiday): void {
    this.router.navigate(['/holidays/view', holiday.id]);
  }

  /**
   * Edit holiday
   */
  editHoliday(holiday: Holiday): void {
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
          console.error('Error deleting holiday:', error);
          this.errorHandler.showError('Failed to delete holiday');
        }
      });
    }
  }

  /**
   * Add new holiday
   */
  addHoliday(): void {
    this.router.navigate(['/holidays/create']);
  }

  /**
   * View calendar
   */
  viewCalendar(): void {
    this.router.navigate(['/holidays/calendar']);
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
}

