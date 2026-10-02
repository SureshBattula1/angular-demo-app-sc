import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/account-list/account-list.component')
      .then(m => m.AccountListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories/new',
    loadComponent: () => import('./pages/account-category-form/account-category-form.component')
      .then(m => m.AccountCategoryFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories/:id/edit',
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
  }
];

