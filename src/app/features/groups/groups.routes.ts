import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/group-list/group-list.component').then(m => m.GroupListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/group-form/group-form.component').then(m => m.GroupFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/group-form/group-form.component').then(m => m.GroupFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/group-view/group-view.component').then(m => m.GroupViewComponent),
    canActivate: [authGuard]
  }
];

