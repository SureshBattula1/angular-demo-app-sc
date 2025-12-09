import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { IndianCurrencyPipe } from '../../shared/pipes/indian-currency.pipe';
import { DashboardService } from './dashboard.service';
import { BranchService } from '../branches/services/branch.service';
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
    IndianCurrencyPipe
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

  /**
   * Get net balance by payment mode (income - expenses)
   */
  getPaymentModeNetBalance(mode: string): number {
    const income = this.getPaymentModeAmount(mode, 'income');
    const expenses = this.getPaymentModeAmount(mode, 'expenses');
    return income - expenses;
  }

}
