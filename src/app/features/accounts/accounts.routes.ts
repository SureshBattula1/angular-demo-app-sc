import { Routes } from '@angular/router';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./account-list.component')
      .then(m => m.AccountListComponent)
  }
];

