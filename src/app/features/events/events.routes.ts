import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: '',
  //   loadComponent: () => import('./pages/event-list/event-list.component').then(m => m.EventListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'create',
  //   loadComponent: () => import('./pages/event-form/event-form.component').then(m => m.EventFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'view/:id',
  //   loadComponent: () => import('./pages/event-view/event-view.component').then(m => m.EventViewComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'edit/:id',
  //   loadComponent: () => import('./pages/event-form/event-form.component').then(m => m.EventFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'upcoming',
  //   loadComponent: () => import('./pages/event-list/event-list.component').then(m => m.EventListComponent),
  //   canActivate: [authGuard],
  //   data: { filter: 'upcoming' }
  // }
];

