import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AccountService } from '../../services/account.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AccountDashboard, Transaction } from '../../../../core/models/account.model';

@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './account-dashboard.component.html',
  styleUrls: ['./account-dashboard.component.scss']
})
export class AccountDashboardComponent implements OnInit {
  loading = false;
  dashboard?: AccountDashboard;
  selectedFinancialYear: string;
  
  constructor(
    private accountService: AccountService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {
    this.selectedFinancialYear = this.getCurrentFinancialYear();
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    
    this.accountService.getDashboard({ 
      financial_year: this.selectedFinancialYear 
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboard = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
      }
    });
  }

  onFinancialYearChange(year: string): void {
    this.selectedFinancialYear = year;
    this.loadDashboard();
  }

  viewAllIncome(): void {
    this.router.navigate(['/accounts/income']);
  }

  viewAllExpenses(): void {
    this.router.navigate(['/accounts/expenses']);
  }

  addTransaction(type: 'Income' | 'Expense'): void {
    this.router.navigate(['/accounts/transactions/create'], {
      queryParams: { type }
    });
  }

  viewTransaction(transaction: Transaction): void {
    this.router.navigate(['/accounts/transactions/view', transaction.id]);
  }

  getCurrentFinancialYear(): string {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    
    if (month < 4) {
      return `${year - 1}-${year}`;
    } else {
      return `${year}-${year + 1}`;
    }
  }
}

