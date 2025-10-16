import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/auth/login']);
      return false;
    }

    const user = authService.currentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    // Redirect to unauthorized page
    router.navigate(['/dashboard']);
    return false;
  };
};

// Helper guards for specific roles
export const adminGuard: CanActivateFn = roleGuard(['SuperAdmin', 'BranchAdmin']);
export const teacherGuard: CanActivateFn = roleGuard(['SuperAdmin', 'BranchAdmin', 'Teacher']);
export const studentGuard: CanActivateFn = roleGuard(['SuperAdmin', 'BranchAdmin', 'Teacher', 'Student']);

