import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const LIBRARY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/library-shell/library-shell.component').then(m => m.LibraryShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // 1. Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/library-dashboard/library-dashboard.component').then(m => m.LibraryDashboardComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      },

      // 2. Catalog (Books, Categories, Authors, Publishers, Subjects)
      {
        path: 'catalog',
        loadComponent: () => import('./pages/catalog/catalog-shell.component').then(m => m.CatalogShellComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' },
        children: [
          { path: '', redirectTo: 'books', pathMatch: 'full' },
          {
            path: 'books',
            loadComponent: () => import('./pages/book-list/book-list.component').then(m => m.BookListComponent)
          },
          {
            path: 'categories',
            loadComponent: () => import('./pages/catalog/categories/category-list.component').then(m => m.CategoryListComponent)
          },
          {
            path: 'authors',
            loadComponent: () => import('./pages/catalog/authors/author-list.component').then(m => m.AuthorListComponent)
          },
          {
            path: 'publishers',
            loadComponent: () => import('./pages/catalog/publishers/publisher-list.component').then(m => m.PublisherListComponent)
          },
          {
            path: 'subjects',
            loadComponent: () => import('./pages/catalog/subjects/subject-list.component').then(m => m.SubjectListComponent)
          }
        ]
      },

      // 3. Inventory (Copies, Shelves, Barcodes, Stock Verification)
      {
        path: 'inventory',
        loadComponent: () => import('./pages/inventory/inventory-shell.component').then(m => m.InventoryShellComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' },
        children: [
          { path: '', redirectTo: 'copies', pathMatch: 'full' },
          {
            path: 'copies',
            loadComponent: () => import('./pages/inventory/copies/copies-list.component').then(m => m.CopiesListComponent)
          },
          {
            path: 'shelves',
            loadComponent: () => import('./pages/inventory/shelves/shelves-list.component').then(m => m.ShelvesListComponent)
          },
          {
            path: 'barcodes',
            loadComponent: () => import('./pages/inventory/barcodes/barcode-generator.component').then(m => m.BarcodeGeneratorComponent)
          },
          {
            path: 'stock-verification',
            loadComponent: () => import('./pages/inventory/stock-verification/stock-verification.component').then(m => m.StockVerificationComponent)
          }
        ]
      },

      // 4. Members (Students & Staff)
      {
        path: 'members',
        loadComponent: () => import('./pages/members/member-list.component').then(m => m.MemberListComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      },

      // 5. Circulation (Issue, Return, Renew, Overdue)
      {
        path: 'circulation',
        loadComponent: () => import('./pages/circulation/circulation-desk.component').then(m => m.CirculationDeskComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      },

      // 6. Reservations
      {
        path: 'reservations',
        loadComponent: () => import('./pages/reservations/reservation-list.component').then(m => m.ReservationListComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      },

      // 7. Fines
      {
        path: 'fines',
        loadComponent: () => import('./pages/fines/fine-list.component').then(m => m.FineListComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      },

      // 8. Procurement
      {
        path: 'procurement',
        loadComponent: () => import('./pages/procurement/procurement-list.component').then(m => m.ProcurementListComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      },

      // 9. Reports
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/library-reports.component').then(m => m.LibraryReportsComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      },

      // Backward-compatible book edit / view / create / issues routes:
      {
        path: 'books/create',
        loadComponent: () => import('./pages/book-form/book-form.component').then(m => m.BookFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.create' }
      },
      {
        path: 'books/edit/:id',
        loadComponent: () => import('./pages/book-form/book-form.component').then(m => m.BookFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.edit' }
      },
      {
        path: 'books/view/:id',
        loadComponent: () => import('./pages/book-view/book-view.component').then(m => m.BookViewComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      },
      {
        path: 'issues',
        loadComponent: () => import('./pages/book-issues/book-issues.component').then(m => m.BookIssuesComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'library.view' }
      }
    ]
  }
];
