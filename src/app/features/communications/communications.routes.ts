import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const COMMUNICATIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'notifications',
    pathMatch: 'full'
  },
  {
    path: 'notifications',
    redirectTo: '/notifications',
    pathMatch: 'full'
  },
  {
    path: 'notifications/compose',
    loadComponent: () =>
      import('./pages/compose-notification/compose-notification.component').then(
        (m) => m.ComposeNotificationComponent
      ),
    canActivate: [permissionGuard],
    data: { permissions: ['communications.create', 'communications.view'], permissionMode: 'any' }
  }
];
