import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/account-dashboard/account-dashboard.component')
      .then(m => m.AccountDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'transactions/create',
    loadComponent: () => import('./pages/transaction-form/transaction-form.component')
      .then(m => m.TransactionFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'transactions/edit/:id',
    loadComponent: () => import('./pages/transaction-form/transaction-form.component')
      .then(m => m.TransactionFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'income',
    loadComponent: () => import('./pages/income-list/income-list.component')
      .then(m => m.IncomeListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'expenses',
    loadComponent: () => import('./pages/expense-list/expense-list.component')
      .then(m => m.ExpenseListComponent),
    canActivate: [authGuard]
  }
];

