import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ADMISSIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/admission-list/admission-list.component').then(m => m.AdmissionListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/admission-form/admission-form.component').then(m => m.AdmissionFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/admission-view/admission-view.component').then(m => m.AdmissionViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/admission-form/admission-form.component').then(m => m.AdmissionFormComponent),
    canActivate: [authGuard]
  }
];

