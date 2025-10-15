import { Routes } from '@angular/router';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../pages/accounts/account-list.component')
      .then(m => m.AccountListComponent)
  }
];

