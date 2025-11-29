import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const TRANSPORT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'routes',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: 'routes',
  //   loadComponent: () => import('./pages/route-list/route-list.component').then(m => m.RouteListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'routes/create',
  //   loadComponent: () => import('./pages/route-form/route-form.component').then(m => m.RouteFormComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'routes/view/:id',
  //   loadComponent: () => import('./pages/route-view/route-view.component').then(m => m.RouteViewComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'vehicles',
  //   loadComponent: () => import('./pages/vehicle-list/vehicle-list.component').then(m => m.VehicleListComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'vehicles/create',
  //   loadComponent: () => import('./pages/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent),
  //   canActivate: [authGuard]
  // }
];

