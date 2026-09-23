import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const TIMETABLE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: '',
  //   loadComponent: () => import('./pages/timetable-list/timetable-list.component').then(m => m.TimetableListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'create',
  //   loadComponent: () => import('./pages/timetable-form/timetable-form.component').then(m => m.TimetableFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'class/:grade/:section',
  //   loadComponent: () => import('./pages/timetable-view/timetable-view.component').then(m => m.TimetableViewComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'edit/:id',
  //   loadComponent: () => import('./pages/timetable-form/timetable-form.component').then(m => m.TimetableFormComponent),
  //   canActivate: [authGuard]
  // }
];

