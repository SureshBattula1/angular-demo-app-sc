import { Routes } from '@angular/router';

export const SCHOOLS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./school-list/school-list.component').then(m => m.SchoolListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./school-form/school-form.component').then(m => m.SchoolFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./school-view/school-view.component').then(m => m.SchoolViewComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./school-form/school-form.component').then(m => m.SchoolFormComponent)
  }
];

