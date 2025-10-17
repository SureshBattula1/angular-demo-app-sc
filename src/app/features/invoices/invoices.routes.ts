import { Routes } from '@angular/router';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./invoice-list.component')
      .then(m => m.InvoiceListComponent)
  }
];

