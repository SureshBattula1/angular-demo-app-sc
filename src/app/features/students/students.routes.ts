import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const STUDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/student-list/student-list.component').then(m => m.StudentListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/student-form/student-form.component').then(m => m.StudentFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/student-view/student-view.component').then(m => m.StudentViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/student-form/student-form.component').then(m => m.StudentFormComponent),
    canActivate: [authGuard]
  }
];
