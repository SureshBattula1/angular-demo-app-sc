import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/attendance-list/attendance-list.component').then(m => m.AttendanceListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'mark',
    loadComponent: () => import('./pages/attendance-form/attendance-form.component').then(m => m.AttendanceFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/attendance-edit/attendance-edit.component').then(m => m.AttendanceEditComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/attendance-view/attendance-view.component').then(m => m.AttendanceViewComponent),
    canActivate: [authGuard]
  }
];

