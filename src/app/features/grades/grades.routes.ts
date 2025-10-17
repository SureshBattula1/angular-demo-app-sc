import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const GRADES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/grade-list/grade-list.component').then(m => m.GradeListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/grade-form/grade-form.component').then(m => m.GradeFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/grade-form/grade-form.component').then(m => m.GradeFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/grade-view/grade-view.component').then(m => m.GradeViewComponent),
    canActivate: [authGuard]
  }
];

