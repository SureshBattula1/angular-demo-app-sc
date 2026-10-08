import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const IMPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/import-dashboard/import-dashboard.component').then(m => m.ImportDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'students',
    loadComponent: () => import('./pages/student-import/student-import.component').then(m => m.StudentImportComponent),
    canActivate: [authGuard]
  },
  {
    path: 'teachers',
    loadComponent: () => import('./pages/teacher-import/teacher-import.component').then(m => m.TeacherImportComponent),
    canActivate: [authGuard]
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/import-history/import-history.component').then(m => m.ImportHistoryComponent),
    canActivate: [authGuard]
  }
];

