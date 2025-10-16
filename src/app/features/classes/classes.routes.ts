import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const CLASSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/class-list/class-list.component').then(m => m.ClassListComponent),
    canActivate: [authGuard]
  }
];

