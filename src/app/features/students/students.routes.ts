import { Routes } from '@angular/router';

export const STUDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../pages/students/student-list.component')
      .then(m => m.StudentListComponent)
  },
  {
    path: 'add',
    loadComponent: () => import('../../pages/students/student-add.component')
      .then(m => m.StudentAddComponent)
  },
  {
    path: 'view/:id',
    loadComponent: () => import('../../pages/students/student-view.component')
      .then(m => m.StudentViewComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('../../pages/students/student-edit.component')
      .then(m => m.StudentEditComponent)
  }
];

