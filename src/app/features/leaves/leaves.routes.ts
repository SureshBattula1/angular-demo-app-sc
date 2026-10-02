import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const leavesRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => 
      import('./pages/leave-list/leave-list.component').then(m => m.LeaveListComponent)
  },
  {
    path: 'add',
    canActivate: [authGuard],
    loadComponent: () => 
      import('./pages/leave-form/leave-form.component').then(m => m.LeaveFormComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [authGuard],
    loadComponent: () => 
      import('./pages/leave-form/leave-form.component').then(m => m.LeaveFormComponent)
  },
  {
    path: 'view/:id',
    canActivate: [authGuard],
    loadComponent: () => 
      import('./pages/leave-view/leave-view.component').then(m => m.LeaveViewComponent)
  }
];

