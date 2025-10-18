import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const HOLIDAYS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full'
  },
  {
    path: 'calendar',
    loadComponent: () => import('./pages/holiday-calendar/holiday-calendar.component')
      .then(m => m.HolidayCalendarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'list',
    loadComponent: () => import('./pages/holiday-list/holiday-list.component')
      .then(m => m.HolidayListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/holiday-form/holiday-form.component')
      .then(m => m.HolidayFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/holiday-form/holiday-form.component')
      .then(m => m.HolidayFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/holiday-view/holiday-view.component')
      .then(m => m.HolidayViewComponent),
    canActivate: [authGuard]
  }
];

