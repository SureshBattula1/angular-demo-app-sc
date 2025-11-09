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
    path: 'categories',
    loadComponent: () => import('./pages/account-category-list/account-category-list.component')
      .then(m => m.AccountCategoryListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories/new',
    loadComponent: () => import('./pages/account-category-form/account-category-form.component')
      .then(m => m.AccountCategoryFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories/:id',
    loadComponent: () => import('./pages/account-category-view/account-category-view.component')
      .then(m => m.AccountCategoryViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories/:id/edit',
    loadComponent: () => import('./pages/account-category-form/account-category-form.component')
      .then(m => m.AccountCategoryFormComponent),
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

