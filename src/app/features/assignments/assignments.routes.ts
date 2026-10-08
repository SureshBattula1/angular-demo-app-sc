import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const ASSIGNMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/assignment-list/assignment-list.component').then(
        m => m.AssignmentListComponent
      ),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'assignments.view' }
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/assignment-form/assignment-form.component').then(
        m => m.AssignmentFormComponent
      ),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'assignments.create' }
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/assignment-form/assignment-form.component').then(
        m => m.AssignmentFormComponent
      ),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'assignments.edit' }
  },
  {
    path: 'view/:id',
    loadComponent: () =>
      import('./pages/assignment-view/assignment-view.component').then(
        m => m.AssignmentViewComponent
      ),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'assignments.view' }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/assignment-view/assignment-view.component').then(
        m => m.AssignmentViewComponent
      ),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'assignments.view' }
  }
];
