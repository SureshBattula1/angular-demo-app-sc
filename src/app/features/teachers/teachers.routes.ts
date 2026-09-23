import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const TEACHERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/teacher-list/teacher-list.component').then(m => m.TeacherListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'teachers.view' }
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/teacher-form/teacher-form.component').then(m => m.TeacherFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'teachers.create' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/teacher-view/teacher-view.component').then(m => m.TeacherViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'teachers.view' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/teacher-form/teacher-form.component').then(m => m.TeacherFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'teachers.edit' }
  }
];
