import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const SECTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/section-list/section-list.component').then(m => m.SectionListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'sections.view' }
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/section-form/section-form.component').then(m => m.SectionFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'sections.create' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/section-view/section-view.component').then(m => m.SectionViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'sections.view' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/section-form/section-form.component').then(m => m.SectionFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'sections.edit' }
  }
];

