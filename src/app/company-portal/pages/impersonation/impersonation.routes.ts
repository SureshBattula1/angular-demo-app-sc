import { Routes } from '@angular/router';

export const IMPERSONATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./impersonation-list/impersonation-list.component').then(m => m.ImpersonationListComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./impersonation-history/impersonation-history.component').then(m => m.ImpersonationHistoryComponent)
  }
];



