import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

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
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'dashboard.view' }
      },
      {
        path: 'branches',
        loadChildren: () => import('./features/branches/branches.routes').then(m => m.BRANCHES_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['branches.view', 'branches.create'], permissionMode: 'any' }
      },     
      {
        path: 'groups',
        loadChildren: () => import('./features/groups/groups.routes').then(m => m.GROUPS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'groups.view' }
      },
      {
        path: 'sections',
        loadChildren: () => import('./features/sections/sections.routes').then(m => m.SECTIONS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'sections.view' }
      },
      {
        path: 'grades',
        loadChildren: () => import('./features/grades/grades.routes').then(m => m.GRADES_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'grades.view' }
      },
      {
        path: 'students',
        loadChildren: () => import('./features/students/students.routes').then(m => m.STUDENTS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['students.view', 'students.create'], permissionMode: 'any' }
      },
      {
        path: 'teachers',
        loadChildren: () => import('./features/teachers/teachers.routes').then(m => m.TEACHERS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'teachers.view' }
      },
      {
        path: 'subjects',
        loadChildren: () => import('./features/subjects/subjects.routes').then(m => m.SUBJECTS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'subjects.view' }
      },
      {
        path: 'departments',
        loadChildren: () => import('./features/departments/departments.routes').then(m => m.DEPARTMENTS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'departments.view' }
      },
      {
        path: 'attendance',
        loadChildren: () => import('./features/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['attendance.view', 'attendance.mark'], permissionMode: 'any' }
      },
      {
        path: 'invoices',
        loadChildren: () => import('./features/invoices/invoices.routes').then(m => m.INVOICES_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'invoices.view' }
      },
      {
        path: 'accounts',
        loadChildren: () => import('./features/accounts/accounts.routes').then(m => m.ACCOUNTS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['accounts.view', 'transactions.view'], permissionMode: 'any' }
      },
      {
        path: 'holidays',
        loadChildren: () => import('./features/holidays/holidays.routes').then(m => m.HOLIDAYS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'holidays.view' }
      },
      {
        path: 'fees',
        loadChildren: () => import('./features/fees/fees.routes').then(m => m.FEES_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['fees.view', 'fees.collect'], permissionMode: 'any' }
      }
    ]
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];