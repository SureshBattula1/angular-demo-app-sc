import { Routes } from '@angular/router';

export const FEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../pages/fees/fee-list.component')
      .then(m => m.FeeListComponent)
  }
];

