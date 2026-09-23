import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const COMMUNICATIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'notifications',
    pathMatch: 'full'
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./pages/notification-center/notification-center.component').then(
        (m) => m.NotificationCenterComponent
      ),
    canActivate: [authGuard],
    data: { permissions: ['communications.view', 'communications.create'], permissionMode: 'any' }
  },
  {
    path: 'notifications/compose',
    loadComponent: () =>
      import('./pages/compose-notification/compose-notification.component').then(
        (m) => m.ComposeNotificationComponent
      ),
    canActivate: [authGuard],
    data: { permissions: ['communications.create', 'communications.view'], permissionMode: 'any' }
  }
];
