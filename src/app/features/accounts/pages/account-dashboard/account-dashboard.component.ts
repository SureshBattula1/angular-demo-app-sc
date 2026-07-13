import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { IndianCurrencyPipe } from '../../../../shared/pipes/indian-currency.pipe';
import { AccountService } from '../../services/account.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { AccountDashboard, Transaction } from '../../../../core/models/account.model';

@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, IndianCurrencyPipe],
  templateUrl: './account-dashboard.component.html',
  styleUrls: ['./account-dashboard.component.scss']
})
export class AccountDashboardComponent implements OnInit {
  loading = false;
  dashboard?: AccountDashboard;
  selectedFinancialYear: string;
  selectedBranch: number | string = '';
  branches: any[] = [];
  financialYears: string[] = [];

  constructor(
    private accountService: AccountService,
    private branchService: BranchService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {
    this.selectedFinancialYear = this.getCurrentFinancialYear();
    this.financialYears = this.getFinancialYearOptions();
  }

  ngOnInit(): void {
    this.loadBranches();
    this.loadDashboard();
  }

  loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: () => {}
    });
  }

  onFilterChange(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    const params: Record<string, unknown> = {
      financial_year: this.selectedFinancialYear
    };
    if (this.selectedBranch !== '' && this.selectedBranch != null) {
      params['branch_id'] = this.selectedBranch;
    }

    this.accountService.getDashboard(params).subscribe({
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

  getFinancialYearOptions(): string[] {
    const years: string[] = [];
    const current = this.getCurrentFinancialYear();
    const [startStr] = current.split('-');
    const startYear = parseInt(startStr, 10);

    for (let i = 0; i < 6; i++) {
      const y = startYear - i;
      years.push(`${y}-${y + 1}`);
    }
    return years;
  }
}

