import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const STUDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/student-list/student-list.component').then(m => m.StudentListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'students.view' }
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/student-form/student-form.component').then(m => m.StudentFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'students.create' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/student-view/student-view.component').then(m => m.StudentViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'students.view' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/student-form/student-form.component').then(m => m.StudentFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'students.edit' }
  }
];
