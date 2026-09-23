import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const LIBRARY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/book-list/book-list.component').then(m => m.BookListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'library.view' }
  },
  {
    path: 'books/create',
    loadComponent: () => import('./pages/book-form/book-form.component').then(m => m.BookFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'library.create' }
  },
  {
    path: 'books/edit/:id',
    loadComponent: () => import('./pages/book-form/book-form.component').then(m => m.BookFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'library.edit' }
  },
  {
    path: 'books/view/:id',
    loadComponent: () => import('./pages/book-view/book-view.component').then(m => m.BookViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'library.view' }
  },
  {
    path: 'issues',
    loadComponent: () => import('./pages/book-issues/book-issues.component').then(m => m.BookIssuesComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: 'library.view' }
  }
];
