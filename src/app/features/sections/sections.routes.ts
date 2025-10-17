import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const SECTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/section-list/section-list.component').then(m => m.SectionListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/section-form/section-form.component').then(m => m.SectionFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/section-view/section-view.component').then(m => m.SectionViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/section-form/section-form.component').then(m => m.SectionFormComponent),
    canActivate: [authGuard]
  }
];

