import { Routes } from '@angular/router';

export const SUBJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../pages/subjects/subject-list.component')
      .then(m => m.SubjectListComponent)
  }
];

