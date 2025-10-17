import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const SUBJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/subject-list/subject-list.component').then(m => m.SubjectListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/subject-form/subject-form.component').then(m => m.SubjectFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/subject-view/subject-view.component').then(m => m.SubjectViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/subject-form/subject-form.component').then(m => m.SubjectFormComponent),
    canActivate: [authGuard]
  }
];
