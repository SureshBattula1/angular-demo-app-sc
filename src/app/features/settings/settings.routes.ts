import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/settings-shell/settings-shell.component').then(m => m.SettingsShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'roles',
        pathMatch: 'full'
      },
      // Roles routes
      {
        path: 'roles',
        loadComponent: () => import('./pages/roles/role-list/role-list.component').then(m => m.RoleListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['roles.view', 'roles.create'], permissionMode: 'any' }
      },
      {
        path: 'roles/create',
        loadComponent: () => import('./pages/roles/role-form/role-form.component').then(m => m.RoleFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'roles.create' }
      },
      {
        path: 'roles/edit/:id',
        loadComponent: () => import('./pages/roles/role-form/role-form.component').then(m => m.RoleFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'roles.update' }
      },
      {
        path: 'roles/view/:id',
        loadComponent: () => import('./pages/roles/role-view/role-view.component').then(m => m.RoleViewComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'roles.view' }
      },
      // Permissions routes
      {
        path: 'permissions',
        loadComponent: () => import('./pages/permissions/permission-list/permission-list.component').then(m => m.PermissionListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['permissions.view', 'permissions.create'], permissionMode: 'any' }
      },
      // Users routes
      {
        path: 'users',
        loadComponent: () => import('./pages/users/user-list/user-list.component').then(m => m.UserListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['users.view', 'users.create'], permissionMode: 'any' }
      },
      {
        path: 'users/create',
        loadComponent: () => import('./pages/users/user-form/user-form.component').then(m => m.UserFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'users.create' }
      },
      {
        path: 'users/edit/:id',
        loadComponent: () => import('./pages/users/user-form/user-form.component').then(m => m.UserFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'users.update' }
      },
      {
        path: 'users/view/:id',
        loadComponent: () => import('./pages/users/user-view/user-view.component').then(m => m.UserViewComponent),
        canActivate: [permissionGuard],
        data: { permissions: 'users.view' }
      }
    ]
  }
];

