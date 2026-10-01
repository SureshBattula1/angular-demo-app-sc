import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

const access = {
  permissions: ['communications.view', 'communications.create', 'bulk_management.view', 'student_attendance.mark'],
  permissionMode: 'any' as const
};

export const NOTIFICATION_CAMPAIGN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/campaign-hub/campaign-hub.component').then(m => m.CampaignHubComponent),
    canActivate: [permissionGuard],
    data: access
  },
  {
    path: 'schedule/:module',
    loadComponent: () => import('./pages/campaign-schedule/campaign-schedule.component').then(m => m.CampaignScheduleComponent),
    canActivate: [permissionGuard],
    data: access
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/campaign-view/campaign-view.component').then(m => m.CampaignViewComponent),
    canActivate: [permissionGuard],
    data: access
  }
];
