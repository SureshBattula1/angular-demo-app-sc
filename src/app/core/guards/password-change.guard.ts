import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const passwordChangeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check password change status
  return authService.checkPasswordChangeStatus().pipe(
    map(response => {
      if (response.success && response.data) {
        // If password has been changed, allow access to normal routes
        if (response.data.is_password_changed) {
          // If trying to access password change page, redirect to dashboard
          if (state.url.includes('change-password-first-time')) {
            router.navigate(['/dashboard']);
            return false;
          }
          return true;
        } else {
          // If password hasn't been changed, redirect to password change page
          if (!state.url.includes('change-password-first-time')) {
            router.navigate(['/auth/change-password-first-time'], { replaceUrl: true });
            return false;
          }
          // Allow access to password change page
          return true;
        }
      }
      // Default: allow access if check fails (fallback)
      return true;
    }),
    catchError(() => {
      // On error, allow access (fallback to prevent blocking)
      return of(true);
    })
  );
};

