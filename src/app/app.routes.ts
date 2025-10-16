import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-shell/main-shell.component').then(m => m.MainShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'students',
        loadChildren: () => import('./features/students/students.routes').then(m => m.STUDENTS_ROUTES)
      },
      {
        path: 'teachers',
        loadChildren: () => import('./features/teachers/teachers.routes').then(m => m.TEACHERS_ROUTES)
      },
      {
        path: 'departments',
        loadChildren: () => import('./features/departments/departments.routes').then(m => m.DEPARTMENTS_ROUTES)
      },
      {
        path: 'subjects',
        loadChildren: () => import('./features/subjects/subjects.routes').then(m => m.SUBJECTS_ROUTES)
      },
      {
        path: 'invoices',
        loadChildren: () => import('./features/invoices/invoices.routes').then(m => m.INVOICES_ROUTES)
      },
      {
        path: 'accounts',
        loadChildren: () => import('./features/accounts/accounts.routes').then(m => m.ACCOUNTS_ROUTES)
      },
      {
        path: 'holidays',
        loadChildren: () => import('./features/holidays/holidays.routes').then(m => m.HOLIDAYS_ROUTES)
      },
      {
        path: 'fees',
        loadChildren: () => import('./features/fees/fees.routes').then(m => m.FEES_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];