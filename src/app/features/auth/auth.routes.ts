import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';
import { passwordChangeGuard } from '../../core/guards/password-change.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'change-password-first-time',
    loadComponent: () => import('./pages/change-password-first-time/change-password-first-time.component').then(m => m.ChangePasswordFirstTimeComponent),
    canActivate: [passwordChangeGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

