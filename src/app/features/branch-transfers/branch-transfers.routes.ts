import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const BRANCH_TRANSFERS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: '',
  //   loadComponent: () => import('./pages/transfer-list/transfer-list.component').then(m => m.TransferListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'create',
  //   loadComponent: () => import('./pages/transfer-form/transfer-form.component').then(m => m.TransferFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'view/:id',
  //   loadComponent: () => import('./pages/transfer-view/transfer-view.component').then(m => m.TransferViewComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'statistics',
  //   loadComponent: () => import('./pages/transfer-statistics/transfer-statistics.component').then(m => m.TransferStatisticsComponent),
  //   canActivate: [authGuard]
  // }
];

