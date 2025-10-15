import { Routes } from '@angular/router';

export const TEACHERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../pages/teachers/teacher-list.component')
      .then(m => m.TeacherListComponent)
  }
];

