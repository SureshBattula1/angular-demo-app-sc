import { Routes } from '@angular/router';

export const HOLIDAYS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./holiday-list.component')
      .then(m => m.HolidayListComponent)
  }
];

