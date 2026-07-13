import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const SUBJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/subject-list/subject-list-enhanced.component').then(m => m.SubjectListEnhancedComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/subject-form/subject-form.component').then(m => m.SubjectFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'assign',
    loadComponent: () => import('./pages/subject-assignment/subject-assignment.component').then(m => m.SubjectAssignmentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'assignments',
    loadComponent: () => import('./pages/assigned-subjects-list/assigned-subjects-list.component').then(m => m.AssignedSubjectsListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/subject-view/subject-view.component').then(m => m.SubjectViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/subject-form/subject-form.component').then(m => m.SubjectFormComponent),
    canActivate: [authGuard]
  }
];
