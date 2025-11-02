import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const EXAMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/exam-list/exam-list.component').then(m => m.ExamListComponent),
    canActivate: [authGuard]
  },
  // Exam Terms
  {
    path: 'term/create',
    loadComponent: () => import('./pages/exam-term-form/exam-term-form.component').then(m => m.ExamTermFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'term/edit/:id',
    loadComponent: () => import('./pages/exam-term-form/exam-term-form.component').then(m => m.ExamTermFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'term/view/:id',
    loadComponent: () => import('./pages/exam-term-view/exam-term-view.component').then(m => m.ExamTermViewComponent),
    canActivate: [authGuard]
  },
  // Exams
  {
    path: 'create',
    loadComponent: () => import('./pages/exam-form/exam-form.component').then(m => m.ExamFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/exam-form/exam-form.component').then(m => m.ExamFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/exam-view/exam-view.component').then(m => m.ExamViewComponent),
    canActivate: [authGuard]
  },
  // Exam Schedules
  {
    path: 'schedule/create',
    loadComponent: () => import('./pages/exam-schedule-form/exam-schedule-form.component').then(m => m.ExamScheduleFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'schedule/edit/:id',
    loadComponent: () => import('./pages/exam-schedule-form/exam-schedule-form.component').then(m => m.ExamScheduleFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'schedule/view/:id',
    loadComponent: () => import('./pages/exam-schedule-view/exam-schedule-view.component').then(m => m.ExamScheduleViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'marks/enter',
    loadComponent: () => import('./pages/enter-marks/enter-marks.component').then(m => m.EnterMarksComponent),
    canActivate: [authGuard]
  }
];

