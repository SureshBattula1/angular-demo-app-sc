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

  // 🔥 Check if request is FormData (file upload)
  const isFormData = req.body instanceof FormData;

  if (token && !skipAuth) {
    // 🔥 For FormData, DON'T set Content-Type (let browser handle it)
    if (isFormData) {
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
          // Content-Type is intentionally NOT set for FormData
        }
      });
      return next(clonedReq);
    }
    
    // For regular JSON requests
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
  if (isFormData) {
    // For FormData, only set Accept header
    const clonedReq = req.clone({
      setHeaders: {
        'Accept': 'application/json'
      }
    });
    return next(clonedReq);
  }
  
  const clonedReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  return next(clonedReq);
};

