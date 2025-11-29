import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const COMMUNICATIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: '',
  //   redirectTo: 'notifications',
  //   pathMatch: 'full'
  // },
  // {
  //   path: 'notifications',
  //   loadComponent: () => import('./pages/notification-list/notification-list.component').then(m => m.NotificationListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'announcements',
  //   loadComponent: () => import('./pages/announcement-list/announcement-list.component').then(m => m.AnnouncementListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'announcements/create',
  //   loadComponent: () => import('./pages/announcement-form/announcement-form.component').then(m => m.AnnouncementFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'announcements/view/:id',
  //   loadComponent: () => import('./pages/announcement-view/announcement-view.component').then(m => m.AnnouncementViewComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'circulars',
  //   loadComponent: () => import('./pages/circular-list/circular-list.component').then(m => m.CircularListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'circulars/create',
  //   loadComponent: () => import('./pages/circular-form/circular-form.component').then(m => m.CircularFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'circulars/view/:id',
  //   loadComponent: () => import('./pages/circular-view/circular-view.component').then(m => m.CircularViewComponent),
  //   canActivate: [authGuard]
  // }
];

