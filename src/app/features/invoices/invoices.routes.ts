import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/invoice-list/invoice-list.component')
      .then(m => m.InvoiceListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'generate',
    loadComponent: () => import('./pages/invoice-generator/invoice-generator.component')
      .then(m => m.InvoiceGeneratorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./pages/invoice-view/invoice-view.component')
      .then(m => m.InvoiceViewComponent),
    canActivate: [authGuard]
  }
];

