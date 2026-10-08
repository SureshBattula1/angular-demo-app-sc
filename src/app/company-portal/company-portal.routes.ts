import { Routes } from '@angular/router';
import { companyAuthGuard } from './guards/company-auth.guard';

export const COMPANY_PORTAL_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/company-portal-layout/company-portal-layout.component').then(m => m.CompanyPortalLayoutComponent),
    canActivate: [companyAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'schools',
        loadChildren: () => import('./pages/schools/schools.routes').then(m => m.SCHOOLS_ROUTES)
      },
      {
        path: 'companies',
        loadChildren: () => import('./pages/companies/companies.routes').then(m => m.COMPANIES_ROUTES)
      },
      {
        path: 'impersonation',
        loadChildren: () => import('./pages/impersonation/impersonation.routes').then(m => m.IMPERSONATION_ROUTES)
      }
    ]
  }
];

