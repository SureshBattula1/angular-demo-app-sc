import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const TRANSPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/transport-shell/transport-shell.component').then(m => m.TransportShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // 1. Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/transport-dashboard/transport-dashboard.component').then(m => m.TransportDashboardComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'transport.view' }
      },

      // 2. Students
      {
        path: 'students',
        loadComponent: () => import('./pages/transport-students/transport-students.component').then(m => m.TransportStudentsComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'transport.view' }
      },

      // 3. Assignments (Single & Bulk)
      {
        path: 'assignments',
        loadComponent: () => import('./pages/transport-assignment/transport-assignment.component').then(m => m.TransportAssignmentComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'transport.view' }
      },

      // 4. Stops Master
      {
        path: 'stops',
        loadComponent: () => import('./pages/stop-list/stop-list.component').then(m => m.StopListComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'transport.view' }
      },

      // 5. Trips (Today, Upcoming, History)
      {
        path: 'trips',
        loadComponent: () => import('./pages/trip-list/trip-list.component').then(m => m.TripListComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'transport.view' }
      },

      // 6. Boarding & Drop Verification
      {
        path: 'boarding',
        loadComponent: () => import('./pages/live-boarding/live-boarding.component').then(m => m.LiveBoardingComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'transport.view' }
      },

      // 7. Live GPS Tracking & ETA
      {
        path: 'tracking',
        loadComponent: () => import('./pages/live-tracking/live-tracking.component').then(m => m.LiveTrackingComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'transport.view' }
      },

      // 8. Finance (Fees, Expenses, Fuel, Maintenance)
      {
        path: 'finance',
        loadComponent: () => import('./pages/transport-finance/transport-finance.component').then(m => m.TransportFinanceComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'transport.view' }
      },

      // 9. Vehicles
      { path: 'vehicles', loadComponent: () => import('./pages/vehicle-list/vehicle-list.component').then(m => m.VehicleListComponent), canActivate: [permissionGuard], data: { permissions: 'transport.view' } },
      { path: 'vehicles/create', loadComponent: () => import('./pages/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.create' } },
      { path: 'vehicles/edit/:id', loadComponent: () => import('./pages/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.edit' } },

      // 10. Drivers
      { path: 'drivers', loadComponent: () => import('./pages/driver-list/driver-list.component').then(m => m.DriverListComponent), canActivate: [permissionGuard], data: { permissions: 'transport.view' } },
      { path: 'drivers/create', loadComponent: () => import('./pages/driver-form/driver-form.component').then(m => m.DriverFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.create' } },
      { path: 'drivers/edit/:id', loadComponent: () => import('./pages/driver-form/driver-form.component').then(m => m.DriverFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.edit' } },

      // 11. Routes
      { path: 'routes', loadComponent: () => import('./pages/route-list/route-list.component').then(m => m.RouteListComponent), canActivate: [permissionGuard], data: { permissions: 'transport.view' } },
      { path: 'routes/create', loadComponent: () => import('./pages/route-form/route-form.component').then(m => m.RouteFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.create' } },
      { path: 'routes/edit/:id', loadComponent: () => import('./pages/route-form/route-form.component').then(m => m.RouteFormComponent), canActivate: [permissionGuard], data: { permissions: 'transport.edit' } },
      { path: 'routes/view/:id', loadComponent: () => import('./pages/route-view/route-view.component').then(m => m.RouteViewComponent), canActivate: [permissionGuard], data: { permissions: 'transport.view' } }
    ]
  }
];
