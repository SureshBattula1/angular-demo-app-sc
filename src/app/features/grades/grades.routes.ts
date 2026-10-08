import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const GRADES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/grade-list/grade-list.component').then(m => m.GradeListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'grades.view' }
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/grade-form/grade-form.component').then(m => m.GradeFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'grades.create' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/grade-form/grade-form.component').then(m => m.GradeFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'grades.edit' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/grade-view/grade-view.component').then(m => m.GradeViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'grades.view' }
  }
];

