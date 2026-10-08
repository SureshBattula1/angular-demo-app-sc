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

  // Driver Portal Access: Driver role or transport.view permission
  const storedRole = user?.role || readStoredUserRole();
  const isDriverRole = user?.role === 'Driver' || storedRole === 'Driver';
  if (state.url.includes('/transport/driver-portal')) {
    if (isDriverRole || permissionService.hasPermission('transport.view')) {
      return true;
    }
    router.navigate(['/dashboard']);
    return false;
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

  // Hard reload (Access School / impersonation) hydrates the user on the next tick.
  // Allow the shell to render until permissions arrive instead of leaving a blank outlet.
  if (hasToken && (!user || userPermissions.length === 0)) {
    return true;
  }

  // School SuperAdmin: dashboard, assignments, notification campaigns.
  if (
    storedRole === 'SuperAdmin' &&
    permissions.some(
      p =>
        p === 'dashboard.view' ||
        p.startsWith('assignments.') ||
        p.startsWith('notifications.')
    )
  ) {
    return true;
  }

  const assignmentRoles = ['SuperAdmin', 'BranchAdmin', 'Teacher', 'Student', 'Staff'];
  if (
    storedRole &&
    assignmentRoles.includes(storedRole) &&
    permissions.some(p => p.startsWith('assignments.'))
  ) {
    return true;
  }

  const hasPermission = mode === 'all'
    ? permissionService.hasAllPermissions(permissions)
    : permissionService.hasAnyPermission(permissions);

  if (!hasPermission) {
    if (isDriverRole) {
      router.navigate(['/transport/boarding']);
      return false;
    }
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

