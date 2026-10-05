import { Component, OnInit, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { BarChartComponent, BarChartData } from '../../shared/components/charts/bar-chart/bar-chart.component';
import { DoughnutChartComponent, DoughnutChartData } from '../../shared/components/charts/doughnut-chart/doughnut-chart.component';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { BranchService } from '../branches/services/branch.service';
import { BranchService as BranchAccessService } from '../../core/services/branch.service';
import { canShowBranchSelector, resolveDefaultBranchId } from '../../core/utils/branch-selection.util';
import { ThemeService } from '../../core/services/theme.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    BarChartComponent,
    DoughnutChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // User role for role-based UI visibility - use a signal to be reactive
  userRole = signal<string>('');
  
  // Date range controls
  selectedPeriod = new FormControl('today');
  customFromDate = new FormControl();
  customToDate = new FormControl();
  
  // Branch filter
  selectedBranch = new FormControl('all');
  branches: any[] = [];
  canSelectBranch = false;
  selectedBranchName = 'All Branches';

  get showBranchSelector(): boolean {
    return this.canSelectBranch;
  }

  /** Income/expense widgets are limited to school admin roles. */
  get showFinancialOverview(): boolean {
    const role = this.userRole();
    return role === 'SuperAdmin' || role === 'Admin' || role === 'BranchAdmin';
  }
  
  // Dashboard data
  dashboardData: any = null;
  loading = false;
  error: string | null = null;
  studentAttendanceChart: DoughnutChartData | null = null;
  teacherAttendanceChart: DoughnutChartData | null = null;
  paymentModeChart: BarChartData | null = null;
  financialOverviewChart: BarChartData | null = null;
  gradeAttendanceChart: BarChartData | null = null;
  gradeAttendanceChartHeight = '320px';
  
  
  // Payment methods (same as transaction form)
  paymentMethods = [
    { value: 'Cash', label: 'Cash', icon: 'money' },
    { value: 'Check', label: 'Check/Cheque', icon: 'receipt' },
    { value: 'Card', label: 'Debit/Credit Card', icon: 'credit_card' },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: 'account_balance' },
    { value: 'UPI', label: 'UPI', icon: 'qr_code_scanner' },
    { value: 'Other', label: 'Other', icon: 'more_horiz' }
  ];
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  private autoRefreshInterval: any;
  private themeService = inject(ThemeService);

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private branchService: BranchService,
    private branchAccess: BranchAccessService,
    private router: Router
  ) {
    effect(() => {
      this.themeService.currentTheme();
      if (this.dashboardData) {
        this.buildAdminCharts();
      }
    });
  }

  ngOnInit(): void {
    // Get user role for conditional rendering - handle async loading
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

    // Explicitly set default branch to 'all' (All Branches)
    this.selectedBranch.setValue('all');

    // Load branches first
    this.loadBranches();

    // Listen to period changes (period toggle is only shown for admin roles,
    // but reloading is safe for any role)
    const periodSub = this.selectedPeriod.valueChanges.subscribe(() => {
      this.loadDashboard();
    });
    this.subscriptions.push(periodSub);
  }

  /**
   * Set user role and start dashboard loading if applicable
   */
  private setUserRole(user: any): void {
    const role = user?.role?.trim() || '';
    this.userRole.set(role);

    if (role === 'Driver') {
      this.router.navigate(['/transport/driver-portal']);
      return;
    }

    console.log('Dashboard User Role Set:', role, 'for user:', user?.email);

    // Load dashboard data for ALL roles. The backend scopes the data to the user's
    // accessible branches and the template renders a role-appropriate subset:
    //  - SuperAdmin / Admin / BranchAdmin: full dashboard incl. financial
    //  - Teacher: same layout as admin (filters, charts, birthdays), no financial
    //  - Student: total students, student attendance
    this.loadDashboard();

    // Auto-refresh every 5 minutes for 'today' view
    this.autoRefreshInterval = setInterval(() => {
      if (this.selectedPeriod.value === 'today') {
        this.loadDashboard(false); // Refresh without showing loader
      }
    }, 300000); // 5 minutes
  }
  
  /**
   * Load branches for filter dropdown
   */
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.branches = response.data;
          this.canSelectBranch = canShowBranchSelector({
            can_select_branch: response.can_select_branch ?? this.branchAccess.canSelectBranch(),
            user_branch_id: response.user_branch_id ?? this.branchAccess.getUserBranchId()
          });
          if (!this.canSelectBranch) {
            const locked = resolveDefaultBranchId(
              {
                can_select_branch: false,
                user_branch_id: response.user_branch_id ?? this.branchAccess.getUserBranchId()
              },
              this.branches,
              this.selectedBranch.value ?? 'all'
            );
            if (locked) {
              this.selectedBranch.setValue(String(locked));
              const branch = this.branches.find(b => String(b.id) === String(locked));
              this.selectedBranchName = branch?.name ?? '';
            }
          }
        }
      },
      error: () => {
        // Error loading branches
      }
    });
  }
  
  /**
   * Handle branch filter change
   */
  onBranchChange(): void {
    const branchId = this.selectedBranch.value;
    if (branchId && branchId !== 'all') {
      const branch = this.branches.find(b => b.id === branchId);
      this.selectedBranchName = branch ? branch.name : '';
    } else {
      this.selectedBranchName = 'All Branches';
    }
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Clear auto-refresh
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  /**
   * Load dashboard data - OPTIMIZED: Single API call!
   */
  loadDashboard(showLoader = true): void {
    if (showLoader) {
      this.loading = true;
    }
    this.error = null;
    
    const params: any = {
      period: this.selectedPeriod.value
    };
    
    // Add branch filter if selected
    if (this.selectedBranch.value && this.selectedBranch.value !== 'all') {
      params.branch_id = this.selectedBranch.value;
    }
    
    // Add custom date range if selected
    if (this.selectedPeriod.value === 'custom') {
      if (this.customFromDate.value) {
        params.from_date = this.formatDate(this.customFromDate.value);
      }
      if (this.customToDate.value) {
        params.to_date = this.formatDate(this.customToDate.value);
      }
    }
    
    // SINGLE API CALL - gets everything!
    const statsSub = this.dashboardService.getComprehensiveStats(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboardData = response.data;
          this.studentBirthdayPage = 0;
          this.teacherBirthdayPage = 0;
          this.buildAdminCharts();
        } else {
          this.clearAdminCharts();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load dashboard data. Please try again.';
        this.clearAdminCharts();
        this.loading = false;
      }
    });
    
    this.subscriptions.push(statsSub);
  }
  
  /**
   * Handle custom date range change
   */
  onCustomRangeChange(): void {
    if (this.customFromDate.value && this.customToDate.value) {
      this.loadDashboard();
    }
  }
  
  /**
   * Format date for API
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${d.getFullYear()}-${month}-${day}`;
  }
  
  /**
   * Calculate stroke dashoffset for circular progress
   */
  calculateStrokeDashoffset(percentage: number): number {
    const circumference = 2 * Math.PI * 60; // r=60
    return circumference - (percentage / 100) * circumference;
  }

  readonly birthdayPageSize = 5;
  studentBirthdayPage = 0;
  teacherBirthdayPage = 0;

  get studentBirthdays(): any[] {
    return this.dashboardData?.birthdays?.students ?? [];
  }

  get teacherBirthdays(): any[] {
    return this.dashboardData?.birthdays?.teachers ?? [];
  }

  get pagedStudentBirthdays(): any[] {
    return this.pageBirthdays(this.studentBirthdays, this.studentBirthdayPage);
  }

  get pagedTeacherBirthdays(): any[] {
    return this.pageBirthdays(this.teacherBirthdays, this.teacherBirthdayPage);
  }

  get birthdayDateLabel(): string {
    return this.dashboardData?.birthdays?.label || 'Today';
  }

  birthdayPageCount(list: any[]): number {
    return Math.max(1, Math.ceil(list.length / this.birthdayPageSize));
  }

  birthdayRangeLabel(list: any[], page: number): string {
    if (!list.length) {
      return '';
    }
    const safePage = Math.min(page, this.birthdayPageCount(list) - 1);
    const start = safePage * this.birthdayPageSize + 1;
    const end = Math.min(list.length, start + this.birthdayPageSize - 1);
    return `${start}–${end} of ${list.length}`;
  }

  changeBirthdayPage(kind: 'student' | 'teacher', delta: number): void {
    const list = kind === 'student' ? this.studentBirthdays : this.teacherBirthdays;
    const current = kind === 'student' ? this.studentBirthdayPage : this.teacherBirthdayPage;
    const next = Math.min(Math.max(current + delta, 0), this.birthdayPageCount(list) - 1);
    if (kind === 'student') {
      this.studentBirthdayPage = next;
    } else {
      this.teacherBirthdayPage = next;
    }
  }

  birthdayInitials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || '?';
  }

  private pageBirthdays(list: any[], page: number): any[] {
    const safePage = Math.min(Math.max(page, 0), this.birthdayPageCount(list) - 1);
    const start = safePage * this.birthdayPageSize;
    return list.slice(start, start + this.birthdayPageSize);
  }

  /**
   * Get payment mode amount for income or expenses
   * Handles different key formats: 'Cash', 'cash', 'bank_transfer', etc.
   */
  getPaymentModeAmount(mode: string, type: 'income' | 'expenses'): number {
    if (!this.dashboardData?.financial) {
      return 0;
    }

    const data = type === 'income' 
      ? this.dashboardData.financial.income_by_mode 
      : this.dashboardData.financial.expenses_by_mode;

    if (!data) {
      return 0;
    }

    // Try different key formats
    return data[mode] || 
           data[mode.toLowerCase()] || 
           data[mode.toLowerCase().replace(' ', '_')] || 
           data[mode.toLowerCase().replace(' ', '-')] || 
           0;
  }

  private clearAdminCharts(): void {
    this.studentAttendanceChart = null;
    this.teacherAttendanceChart = null;
    this.paymentModeChart = null;
    this.financialOverviewChart = null;
    this.gradeAttendanceChart = null;
  }

  private buildAdminCharts(): void {
    const attendance = this.dashboardData?.attendance;
    this.studentAttendanceChart = this.attendanceDoughnut(attendance?.students);
    this.teacherAttendanceChart = this.attendanceDoughnut(attendance?.teachers);
    this.paymentModeChart = this.buildPaymentModeChart();
    this.financialOverviewChart = this.buildFinancialOverviewChart();
    this.gradeAttendanceChart = this.buildGradeAttendanceChart();
  }

  private attendanceDoughnut(stats: {
    present?: number;
    absent?: number;
    leaves?: number;
    late?: number;
  } | null | undefined): DoughnutChartData | null {
    if (!stats) {
      return null;
    }
    const present = Number(stats.present || 0);
    const absent = Number(stats.absent || 0);
    const leaves = Number(stats.leaves || 0);
    const late = Number(stats.late || 0);
    if (present + absent + leaves + late <= 0) {
      return null;
    }
    const labels = ['Present', 'Absent', 'Leave'];
    const data = [present, absent, leaves];
    const backgroundColor = [
      this.themeColor('--success-color', '#2e7d32'),
      this.themeColor('--error-color', '#c62828'),
      this.themeColor('--warning-color', '#ef6c00')
    ];
    if (late > 0) {
      labels.push('Late');
      data.push(late);
      backgroundColor.push(this.themeColor('--info-color', '#1565c0'));
    }
    return { labels, data, backgroundColor };
  }

  private buildFinancialOverviewChart(): BarChartData | null {
    const financial = this.dashboardData?.financial;
    const income = Number(financial?.total_income || 0);
    const expenses = Number(financial?.total_expenses || 0);
    const net = Number(financial?.net_balance || 0);
    const incomeTx = Number(financial?.income_transactions || 0);
    const expenseTx = Number(financial?.expense_transactions || 0);
    if (income === 0 && expenses === 0 && incomeTx === 0 && expenseTx === 0) {
      return null;
    }
    return {
      labels: [
        `Income (${incomeTx} txn)`,
        `Expenses (${expenseTx} txn)`,
        'Net balance'
      ],
      datasets: [
        {
          label: 'Amount',
          data: [income, expenses, net],
          backgroundColor: [
            this.themeColor('--success-color', '#2e7d32'),
            this.themeColor('--error-color', '#c62828'),
            net >= 0
              ? this.themeColor('--primary-color', '#1565c0')
              : this.themeColor('--error-color', '#c62828')
          ]
        }
      ]
    };
  }

  private buildPaymentModeChart(): BarChartData | null {
    const labels: string[] = [];
    const income: number[] = [];
    const expenses: number[] = [];
    for (const method of this.paymentMethods) {
      labels.push(method.label);
      income.push(this.getPaymentModeAmount(method.value, 'income'));
      expenses.push(this.getPaymentModeAmount(method.value, 'expenses'));
    }
    if (income.every(amount => amount === 0) && expenses.every(amount => amount === 0)) {
      return null;
    }
    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: income,
          backgroundColor: this.themeColor('--success-color', '#2e7d32')
        },
        {
          label: 'Expenses',
          data: expenses,
          backgroundColor: this.themeColor('--error-color', '#c62828')
        }
      ]
    };
  }

  private buildGradeAttendanceChart(): BarChartData | null {
    const rows: {
      label?: string;
      grade?: string;
      section?: string;
      present?: number;
      absent?: number;
      leaves?: number;
    }[] = this.dashboardData?.trends?.attendance || [];
    const labels: string[] = [];
    const present: number[] = [];
    const absent: number[] = [];
    const leaves: number[] = [];
    for (const row of rows) {
      const grade = String(row.grade || 'Unassigned').trim();
      const section = String(row.section || '').trim();
      const label = String(row.label || '').trim() || (section ? `${grade} - ${section}` : grade);
      labels.push(label);
      present.push(Number(row.present || 0));
      absent.push(Number(row.absent || 0));
      leaves.push(Number(row.leaves || 0));
    }
    const hasMarks = present.some((value, index) => value + absent[index] + leaves[index] > 0);
    if (!hasMarks) {
      this.gradeAttendanceChartHeight = '240px';
      return null;
    }
    this.gradeAttendanceChartHeight = `${Math.max(240, labels.length * 26)}px`;
    return {
      labels,
      datasets: [
        { label: 'Present', data: present, backgroundColor: this.themeColor('--success-color', '#2e7d32') },
        { label: 'Absent', data: absent, backgroundColor: this.themeColor('--error-color', '#c62828') },
        { label: 'Leave', data: leaves, backgroundColor: this.themeColor('--warning-color', '#ef6c00') }
      ]
    };
  }

  private themeColor(variable: string, fallback: string): string {
    if (typeof document === 'undefined') {
      return fallback;
    }
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return value || fallback;
  }

}
