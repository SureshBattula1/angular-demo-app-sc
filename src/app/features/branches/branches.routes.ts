import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const BRANCHES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/branch-list/branch-list.component').then(m => m.BranchListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/branch-form/branch-form.component').then(m => m.BranchFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/branch-form/branch-form.component').then(m => m.BranchFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/branch-view/branch-view.component').then(m => m.BranchViewComponent),
    canActivate: [authGuard]
  }
];

