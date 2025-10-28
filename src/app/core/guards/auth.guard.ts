import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // console.log('Auth guard check - isLoggedIn:', authService.isLoggedIn());
  
  if (authService.isLoggedIn()) {
    // console.log('Auth guard: Access granted');
    return true;
  }

  // console.log('Auth guard: Redirecting to login');
  // Store the attempted URL for redirecting
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};

