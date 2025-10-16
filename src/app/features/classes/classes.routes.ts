import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const CLASSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/class-list/class-list.component').then(m => m.ClassListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/class-form/class-form.component').then(m => m.ClassFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/class-view/class-view.component').then(m => m.ClassViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/class-form/class-form.component').then(m => m.ClassFormComponent),
    canActivate: [authGuard]
  }
];

