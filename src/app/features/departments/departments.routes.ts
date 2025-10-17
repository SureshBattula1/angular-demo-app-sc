import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const DEPARTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/department-list/department-list.component').then(m => m.DepartmentListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/department-form/department-form.component').then(m => m.DepartmentFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/department-view/department-view.component').then(m => m.DepartmentViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/department-form/department-form.component').then(m => m.DepartmentFormComponent),
    canActivate: [authGuard]
  }
];
