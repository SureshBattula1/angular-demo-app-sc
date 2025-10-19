import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const FEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/fee-list/fee-list.component').then(m => m.FeeListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'structure/create',
    loadComponent: () => import('./pages/fee-structure-form/fee-structure-form.component').then(m => m.FeeStructureFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'structure/edit/:id',
    loadComponent: () => import('./pages/fee-structure-form/fee-structure-form.component').then(m => m.FeeStructureFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'structure/view/:id',
    loadComponent: () => import('./pages/fee-view/fee-view.component').then(m => m.FeeViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'payment/create',
    loadComponent: () => import('./pages/fee-payment-form/fee-payment-form.component').then(m => m.FeePaymentFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'payment/view/:id',
    loadComponent: () => import('./pages/fee-view/fee-view.component').then(m => m.FeeViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'student/:id',
    loadComponent: () => import('./pages/fee-view/fee-view.component').then(m => m.FeeViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'type/create',
    loadComponent: () => import('./pages/fee-type-form/fee-type-form.component').then(m => m.FeeTypeFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'type/edit/:id',
    loadComponent: () => import('./pages/fee-type-form/fee-type-form.component').then(m => m.FeeTypeFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'type/view/:id',
    loadComponent: () => import('./pages/fee-type-view/fee-type-view.component').then(m => m.FeeTypeViewComponent),
    canActivate: [authGuard]
  }
];
