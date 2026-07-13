import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const BRANCHES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/branch-list/branch-list.component').then(m => m.BranchListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'branches.view' }
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/branch-form/branch-form.component').then(m => m.BranchFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'branches.create' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/branch-form/branch-form.component').then(m => m.BranchFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'branches.edit' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/branch-view/branch-view.component').then(m => m.BranchViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'branches.view' }
  }
];

