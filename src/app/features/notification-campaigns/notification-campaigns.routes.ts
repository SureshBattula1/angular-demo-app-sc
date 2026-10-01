import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

const hubAccess = {
  permissions: ['notifications.view', 'notifications.create'],
  permissionMode: 'any' as const
};

export const NOTIFICATION_CAMPAIGN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/campaign-hub/campaign-hub.component').then(m => m.CampaignHubComponent),
    canActivate: [permissionGuard],
    data: hubAccess
  },
  {
    path: 'schedule/:module',
    loadComponent: () => import('./pages/campaign-schedule/campaign-schedule.component').then(m => m.CampaignScheduleComponent),
    canActivate: [permissionGuard],
    data: { permissions: 'notifications.create' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/campaign-view/campaign-view.component').then(m => m.CampaignViewComponent),
    canActivate: [permissionGuard],
    data: { permissions: 'notifications.view' }
  }
];
