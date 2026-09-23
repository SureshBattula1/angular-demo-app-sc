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
    return true;
  }
  
  // Also allow if URL contains /students/view/ and user is a student (even without query param yet)
  if (isStudentRole && isStudentsRoute) {
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
  const hasToken = authService.isLoggedIn();
  const storedRole = user?.role || readStoredUserRole();

  // Hard reload (Access School / impersonation) hydrates the user on the next tick.
  // Allow the shell to render until permissions arrive instead of leaving a blank outlet.
  if (hasToken && (!user || userPermissions.length === 0)) {
    return true;
  }

  // School SuperAdmin always has dashboard; other modules still use assigned slugs.
  if (storedRole === 'SuperAdmin' && permissions.includes('dashboard.view')) {
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

function readStoredUserRole(): string | null {
  const raw = localStorage.getItem('current_user');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw)?.role ?? null;
  } catch {
    return null;
  }
}

