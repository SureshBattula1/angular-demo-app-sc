import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const LIBRARY_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'books',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: 'books',
  //   loadComponent: () => import('./pages/book-list/book-list.component').then(m => m.BookListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'books/create',
  //   loadComponent: () => import('./pages/book-form/book-form.component').then(m => m.BookFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'books/view/:id',
  //   loadComponent: () => import('./pages/book-view/book-view.component').then(m => m.BookViewComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'books/edit/:id',
  //   loadComponent: () => import('./pages/book-form/book-form.component').then(m => m.BookFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'issues',
  //   loadComponent: () => import('./pages/book-issues/book-issues.component').then(m => m.BookIssuesComponent),
  //   canActivate: [authGuard]
  // }
];

