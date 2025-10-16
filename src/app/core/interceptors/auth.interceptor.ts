import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip authentication for login and register endpoints
  const skipAuth = req.url.includes('/login') || 
                   req.url.includes('/register') || 
                   req.url.includes('/forgot-password') ||
                   req.url.includes('/reset-password');

  if (token && !skipAuth) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return next(clonedReq);
  }

  // Add default headers for non-authenticated requests
  const clonedReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  return next(clonedReq);
};

