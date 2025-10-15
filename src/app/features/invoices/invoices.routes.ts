import { Routes } from '@angular/router';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../pages/invoices/invoice-list.component')
      .then(m => m.InvoiceListComponent)
  }
];

