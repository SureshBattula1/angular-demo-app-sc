import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { DoughnutChartComponent, DoughnutChartData } from '../../shared/components/charts/doughnut-chart/doughnut-chart.component';
import { BarChartComponent } from '../../shared/components/charts/bar-chart/bar-chart.component';
import { DashboardService } from './dashboard.service';
import { BranchService } from '../branches/services/branch.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
    DoughnutChartComponent,
    BarChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Date range controls
  selectedPeriod = new FormControl('today');
  customFromDate = new FormControl();
  customToDate = new FormControl();
  
  // Branch filter
  selectedBranch = new FormControl('all');
  branches: any[] = [];
  selectedBranchName: string = 'All Branches';
  
  // Dashboard data
  dashboardData: any = null;
  loading = false;
  error: string | null = null;
  
  // Chart data
  attendanceTrendData: any | null = null; // Changed to bar chart data
  feeBreakdownData: DoughnutChartData | null = null;
  feeByClassData: any | null = null; // Stacked bar chart for fees by class
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  private autoRefreshInterval: any;

  constructor(
    private dashboardService: DashboardService,
    private branchService: BranchService
  ) {}

  ngOnInit(): void {
    // Explicitly set default branch to 'all' (All Branches)
    this.selectedBranch.setValue('all');
    
    // Load branches first
    this.loadBranches();
    
    // Load dashboard data
    this.loadDashboard();
    
    // Auto-refresh every 5 minutes for 'today' view
    this.autoRefreshInterval = setInterval(() => {
      if (this.selectedPeriod.value === 'today') {
        this.loadDashboard(false); // Refresh without showing loader
      }
    }, 300000); // 5 minutes
    
    // Listen to period changes
    const periodSub = this.selectedPeriod.valueChanges.subscribe(() => {
      this.loadDashboard();
    });
    this.subscriptions.push(periodSub);
  }
  
  /**
   * Load branches for filter dropdown
   */
  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: (error) => {
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
  loadDashboard(showLoader: boolean = true): void {
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
          this.prepareChartData();
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load dashboard data. Please try again.';
        this.loading = false;
      }
    });
    
    this.subscriptions.push(statsSub);
  }
  
  /**
   * Prepare chart data from dashboard response
   */
  private prepareChartData(): void {
    if (!this.dashboardData) return;
    
    // Attendance by Grade/Section - Bar Chart
    if (this.dashboardData.trends?.attendance) {
      const trend = this.dashboardData.trends.attendance;
      
      this.attendanceTrendData = {
        labels: trend.map((item: any) => item.label), // e.g., "Grade 1 - A"
        datasets: [
          {
            label: 'Present',
            data: trend.map((item: any) => item.present),
            backgroundColor: 'rgba(76, 175, 80, 0.8)', // Green
            borderColor: '#4CAF50',
            borderWidth: 1
          },
          {
            label: 'Absent',
            data: trend.map((item: any) => item.absent),
            backgroundColor: 'rgba(244, 67, 54, 0.8)', // Red
            borderColor: '#F44336',
            borderWidth: 1
          },
          {
            label: 'Leave',
            data: trend.map((item: any) => item.leaves),
            backgroundColor: 'rgba(255, 152, 0, 0.8)', // Orange
            borderColor: '#FF9800',
            borderWidth: 1
          }
        ]
      };
    }
    
    // Fee Breakdown Doughnut Chart
    if (this.dashboardData.fees) {
      const fees = this.dashboardData.fees;
      this.feeBreakdownData = {
        labels: ['Collected', 'Pending', 'Overdue'],
        data: [
          fees.total_collected || 0,
          fees.total_pending || 0,
          fees.total_overdue || 0
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
      };
    }
    
    // Fee Collection by Class - Stacked Bar Chart
    if (this.dashboardData.fees_by_class && this.dashboardData.fees_by_class.length > 0) {
      const feeData = this.dashboardData.fees_by_class;
      
      // Extract the data
      const paidAmounts = feeData.map((item: any) => item.total_paid);
      const unpaidAmounts = feeData.map((item: any) => item.total_unpaid);
      
      this.feeByClassData = {
        labels: feeData.map((item: any) => item.label), // e.g., "Grade 1 - A"
        datasets: [
          {
            label: 'Paid',
            data: paidAmounts,
            backgroundColor: '#4CAF50', // Green
            borderColor: '#388E3C',
            borderWidth: 1,
            barThickness: 25, // Fixed bar thickness
            maxBarThickness: 30
          },
          {
            label: 'Unpaid',
            data: unpaidAmounts,
            backgroundColor: '#FF5252', // Red
            borderColor: '#D32F2F',
            borderWidth: 1,
            barThickness: 25, // Fixed bar thickness
            maxBarThickness: 30
          }
        ]
      };
    } else {
      this.feeByClassData = null;
    }
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
   * Format date for chart labels
   */
  private formatChartDate(dateString: string): string {
    const date = new Date(dateString);
    const period = this.selectedPeriod.value;
    
    if (period === 'today' || period === 'week') {
      // Show day of week for today/week view
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      // Show date for month/custom view
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  
  /**
   * Refresh dashboard
   */
  refresh(): void {
    this.loadDashboard();
  }
  
  /**
   * Calculate stroke dashoffset for circular progress
   */
  calculateStrokeDashoffset(percentage: number): number {
    const circumference = 2 * Math.PI * 60; // r=60
    return circumference - (percentage / 100) * circumference;
  }
  
  /**
   * Calculate dynamic height for fee chart based on number of classes
   * More classes = taller chart for better spacing
   * Maximum 1000px to prevent excessive height
   */
  getDynamicFeeChartHeight(): string {
    if (!this.dashboardData?.fees_by_class) {
      return '400px';
    }
    
    const numClasses = this.dashboardData.fees_by_class.length;
    // Calculate height: 60px per class/section + 100px for legend/padding
    // Minimum 400px, Maximum 1000px
    const heightInPixels = Math.min(700, Math.max(400, (numClasses * 60) + 100));
    
    return `${heightInPixels}px`;
  }
}
