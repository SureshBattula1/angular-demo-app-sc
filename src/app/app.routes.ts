import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/students',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./pages/students/student-list.component').then(m => m.StudentListComponent)
      },
      {
        path: 'students/view',
        loadComponent: () => import('./pages/students/student-view.component').then(m => m.StudentViewComponent)
      },
      {
        path: 'students/add',
        loadComponent: () => import('./pages/students/student-add.component').then(m => m.StudentAddComponent)
      },
      {
        path: 'students/edit',
        loadComponent: () => import('./pages/students/student-edit.component').then(m => m.StudentEditComponent)
      },
      {
        path: 'teachers',
        loadComponent: () => import('./pages/teachers/teacher-list.component').then(m => m.TeacherListComponent)
      },
      {
        path: 'departments',
        loadComponent: () => import('./pages/departments/department-list.component').then(m => m.DepartmentListComponent)
      },
      {
        path: 'subjects',
        loadComponent: () => import('./pages/subjects/subject-list.component').then(m => m.SubjectListComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./pages/invoices/invoice-list.component').then(m => m.InvoiceListComponent)
      },
      {
        path: 'accounts',
        loadComponent: () => import('./pages/accounts/account-list.component').then(m => m.AccountListComponent)
      },
      {
        path: 'holidays',
        loadComponent: () => import('./pages/holidays/holiday-list.component').then(m => m.HolidayListComponent)
      },
      {
        path: 'fees',
        loadComponent: () => import('./pages/fees/fee-list.component').then(m => m.FeeListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/students'
  }
];