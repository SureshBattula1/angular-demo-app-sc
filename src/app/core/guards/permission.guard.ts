import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermissions = route.data['permissions'] as string | string[];
  const mode = route.data['permissionMode'] as 'any' | 'all' || 'any';
  
  // Get current user
  const user = authService.currentUser();
  
  // SPECIAL CASE: Allow students to view their own profile
  // Check if this is a student trying to access /students/view/* with studentView=true
  const isStudentRole = user?.role === 'Student';
  const isStudentsRoute = state.url.includes('/students/view/');
  const hasStudentViewParam = state.url.includes('studentView=true');
  
  if (isStudentRole && isStudentsRoute && hasStudentViewParam) {
    console.log('Permission guard: Allowing student to view own profile', {
      url: state.url,
      user: user.role
    });
    return true;
  }
  
  // Also allow if URL contains /students/view/ and user is a student (even without query param yet)
  if (isStudentRole && isStudentsRoute) {
    console.log('Permission guard: Allowing student to access student view route');
    return true;
  }

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
  // allow access temporarily so page can load. Permissions will be enforced once loaded.
  if (user && userPermissions.length === 0) {
    // Logged in but no permissions loaded yet - allow access temporarily
    // The directive will hide menu items and buttons if user doesn't have permissions
    console.warn('Permissions not loaded yet, allowing temporary access');
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

