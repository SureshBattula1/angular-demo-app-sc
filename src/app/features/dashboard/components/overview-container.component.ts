import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DashboardService } from '../dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { BranchService } from '../../branches/services/branch.service';
import { Subscription } from 'rxjs';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';

// Interfaces
export interface SuperAdminOverview {
  totalBranches: number;
  totalTeachers: number;
  totalStudents: number;
  totalRevenue: number;
  totalExpenses: number;
  netBalance: number;
  branchBreakdown: BranchBreakdown[];
}

export interface BranchBreakdown {
  branchId: number | string;
  branchName: string;
  teacherCount: number;
  studentCount: number;
  revenue: number;
}

export interface AdminOverview {
  branchName: string;
  totalTeachers: number;
  totalStudents: number;
  totalRevenue: number;
  totalExpenses: number;
  netBalance: number;
  attendanceToday: number;
}

export interface TeacherOverview {
  branchName: string;
  totalStudents: number;
  totalTeachers: number;
  attendanceToday: number;
  absentToday: number;
}

export interface StudentOverview {
  branchName: string;
  totalTeachers: number;
  totalStudents: number;
}

export interface OverviewData {
  superAdmin?: SuperAdminOverview;
  admin?: AdminOverview;
  teacher?: TeacherOverview;
  student?: StudentOverview;
}

@Component({
  selector: 'app-overview-container',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    IndianCurrencyPipe
  ],
  templateUrl: './overview-container.component.html',
  styleUrls: ['./overview-container.component.scss']
})
export class OverviewContainerComponent implements OnInit, OnDestroy {
  userRole: string = '';
  branchId: number | null = null;
  overviewData: OverviewData = {};
  loading = false;
  error: string | null = null;
  branches: any[] = [];
  selectedBranch = new FormControl('all');

  private subscriptions: Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private branchService: BranchService
  ) {}

  ngOnInit(): void {
    // Get the current user - handle async loading
    const currentUser = this.authService.currentUser();

    if (currentUser) {
      this.setUserRole(currentUser);
    } else {
      // If user is not loaded yet, subscribe to currentUser changes
      const userSub = this.authService.currentUser$.subscribe((user) => {
        if (user) {
          this.setUserRole(user);
        }
      });
      this.subscriptions.push(userSub);
    }

    this.loadBranches();
    this.loadOverviewData();

    // Listen to branch changes
    const branchSub = this.selectedBranch.valueChanges.subscribe(() => {
      this.loadOverviewData();
    });
    this.subscriptions.push(branchSub);
  }

  /**
   * Set user role and branch from user object
   */
  private setUserRole(user: any): void {
    this.userRole = user?.role?.trim() || '';
    this.branchId = user?.branch_id || null;

    // Debug logging to verify role is set correctly
    console.log('User role set to:', this.userRole, 'for user:', user?.email);

    // Reload data when role is set
    if (this.userRole) {
      this.loadOverviewData();
    }
  }

  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: () => {
        // Handle error
      }
    });
  }

  loadOverviewData(): void {
    this.loading = true;
    this.error = null;

    switch (this.userRole) {
      case 'SuperAdmin':
        this.loadSuperAdminOverview();
        break;
      case 'Admin':
      case 'BranchAdmin':
        this.loadAdminOverview();
        break;
      case 'Teacher':
        this.loadTeacherOverview();
        break;
      case 'Student':
        this.loadStudentOverview();
        break;
      case 'Accountant':
        // Accountant gets same overview as BranchAdmin
        this.loadAdminOverview();
        break;
      default:
        this.loading = false;
    }
  }

  loadSuperAdminOverview(): void {
    const sub = this.dashboardService.getSuperAdminOverview().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.overviewData = { superAdmin: response.data };
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load overview data';
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadAdminOverview(): void {
    const branchId = this.selectedBranch.value && this.selectedBranch.value !== 'all' 
      ? this.selectedBranch.value 
      : this.branchId;
    
    if (!branchId) {
      this.loading = false;
      return;
    }

    const sub = this.dashboardService.getAdminOverview(branchId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.overviewData = { admin: response.data };
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load branch overview';
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadTeacherOverview(): void {
    const sub = this.dashboardService.getTeacherOverview().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.overviewData = { teacher: response.data };
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load teacher overview';
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadStudentOverview(): void {
    const sub = this.dashboardService.getStudentOverview().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.overviewData = { student: response.data };
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load student overview';
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
