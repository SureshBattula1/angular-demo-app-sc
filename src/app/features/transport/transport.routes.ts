import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const TRANSPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/transport-shell/transport-shell.component').then(m => m.TransportShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'vehicles', pathMatch: 'full' },

      { path: 'vehicles', loadComponent: () => import('./pages/vehicle-list/vehicle-list.component').then(m => m.VehicleListComponent), canActivate: [permissionGuard], data: { permissions: 'transport.view' } },
      { path: 'vehicles/create', loadComponent: () => import('./pages/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.create' } },
      { path: 'vehicles/edit/:id', loadComponent: () => import('./pages/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.edit' } },

      { path: 'drivers', loadComponent: () => import('./pages/driver-list/driver-list.component').then(m => m.DriverListComponent), canActivate: [permissionGuard], data: { permissions: 'transport.view' } },
      { path: 'drivers/create', loadComponent: () => import('./pages/driver-form/driver-form.component').then(m => m.DriverFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.create' } },
      { path: 'drivers/edit/:id', loadComponent: () => import('./pages/driver-form/driver-form.component').then(m => m.DriverFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.edit' } },

      { path: 'routes', loadComponent: () => import('./pages/route-list/route-list.component').then(m => m.RouteListComponent), canActivate: [permissionGuard], data: { permissions: 'transport.view' } },
      { path: 'routes/create', loadComponent: () => import('./pages/route-form/route-form.component').then(m => m.RouteFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.create' } },
      { path: 'routes/edit/:id', loadComponent: () => import('./pages/route-form/route-form.component').then(m => m.RouteFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.edit' } },
      { path: 'routes/view/:id', loadComponent: () => import('./pages/route-view/route-view.component').then(m => m.RouteViewComponent), canActivate: [permissionGuard], data: { permissions: 'transport.view' } }
    ]
  }
];
