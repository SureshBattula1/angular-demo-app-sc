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
        data: { permissions: ['student_attendance.view', 'student_attendance.mark', 'teacher_attendance.view', 'teacher_attendance.mark'], permissionMode: 'any' }
      },
      {
        path: 'leaves',
        loadChildren: () => import('./features/leaves/leaves.routes').then(m => m.leavesRoutes)
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
      },
      {
        path: 'exams',
        loadChildren: () => import('./features/exams/exams.routes').then(m => m.EXAMS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['exams.view', 'exams.create'], permissionMode: 'any' }
      },
      {
        path: 'imports',
        loadChildren: () => import('./features/imports/imports.routes').then(m => m.IMPORTS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: 'import.view' }
      },
      {
        path: 'admissions',
        loadChildren: () => import('./features/admissions/admissions.routes').then(m => m.ADMISSIONS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['admissions.view', 'admissions.create'], permissionMode: 'any' }
      },
      {
        path: 'library',
        loadChildren: () => import('./features/library/library.routes').then(m => m.LIBRARY_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['library.view', 'library.manage'], permissionMode: 'any' }
      },
      {
        path: 'transport',
        loadChildren: () => import('./features/transport/transport.routes').then(m => m.TRANSPORT_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['transport.view', 'transport.manage'], permissionMode: 'any' }
      },
      {
        path: 'timetable',
        loadChildren: () => import('./features/timetable/timetable.routes').then(m => m.TIMETABLE_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['timetable.view', 'timetable.manage'], permissionMode: 'any' }
      },
      {
        path: 'events',
        loadChildren: () => import('./features/events/events.routes').then(m => m.EVENTS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['events.view', 'events.create'], permissionMode: 'any' }
      },
      {
        path: 'communications',
        loadChildren: () => import('./features/communications/communications.routes').then(m => m.COMMUNICATIONS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['communications.view', 'communications.create'], permissionMode: 'any' }
      },
      {
        path: 'branch-transfers',
        loadChildren: () => import('./features/branch-transfers/branch-transfers.routes').then(m => m.BRANCH_TRANSFERS_ROUTES),
        canActivate: [permissionGuard],
        data: { permissions: ['branch_transfers.view', 'branch_transfers.create'], permissionMode: 'any' }
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
