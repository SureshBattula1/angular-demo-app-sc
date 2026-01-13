import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const PROMOTIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'promote',
    pathMatch: 'full'
  },
  {
    path: 'promote',
    loadComponent: () => import('./pages/student-promotion/student-promotion.component').then(m => m.StudentPromotionComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'students.promote' }
  }
];


