import { Routes } from '@angular/router';

export const COMPANIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./company-list/company-list.component').then(m => m.CompanyListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./company-form/company-form.component').then(m => m.CompanyFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./company-view/company-view.component').then(m => m.CompanyViewComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./company-form/company-form.component').then(m => m.CompanyFormComponent)
  }
];

