import { Routes } from '@angular/router';

export const GLOBAL_SEARCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/search-results/search-results.component').then(m => m.SearchResultsComponent)
  }
];
