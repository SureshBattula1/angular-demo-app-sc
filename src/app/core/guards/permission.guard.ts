import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermissions = route.data['permissions'] as string | string[];
  const mode = route.data['permissionMode'] as 'any' | 'all' || 'any';

  // If no permissions required, allow access
  if (!requiredPermissions) {
    return true;
  }

  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];

  // Get current user permissions
  const userPermissions = permissionService.userPermissions();
  
  // If permissions are still loading (empty array but user is logged in),
  // temporarily allow access. The sidebar will filter the menu anyway.
  const user = authService.currentUser();
  if (user && userPermissions.length === 0) {
    return true;
  }

  const hasPermission = mode === 'all'
    ? permissionService.hasAllPermissions(permissions)
    : permissionService.hasAnyPermission(permissions);

  if (!hasPermission) {
    // Don't redirect to dashboard if we're already there or it would cause loop
    if (route.url[0]?.path !== 'dashboard') {
      router.navigate(['/dashboard'], {
        queryParams: { 
          error: 'permission_denied',
          required: permissions.join(',')
        }
      });
    }
    return false;
  }

  return true;
};

