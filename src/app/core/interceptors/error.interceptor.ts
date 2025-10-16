import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../services/error-handler.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log error for debugging
      errorHandler.logError(error);

      // Handle specific HTTP errors
      if (error.status === 401) {
        // Unauthorized - clear session and redirect to login
        authService.clearSession();
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        // Forbidden - redirect to unauthorized page or show message
        errorHandler.showError(error);
      } else if (error.status === 404) {
        // Not found
        errorHandler.showError(error);
      } else if (error.status === 422) {
        // Validation errors - show error message
        errorHandler.showError(error);
      } else if (error.status === 429) {
        // Too many requests - rate limiting
        errorHandler.showError(error);
      } else if (error.status >= 500) {
        // Server errors
        errorHandler.showError(error);
      } else if (error.status === 0) {
        // Network error
        errorHandler.showError(error);
      }

      return throwError(() => error);
    })
  );
};

