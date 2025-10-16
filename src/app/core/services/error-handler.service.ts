import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ErrorMessage {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Handle HTTP errors
   */
  handleError(error: unknown): ErrorMessage {
    let errorMessage: ErrorMessage = {
      title: 'Error',
      message: 'An unexpected error occurred',
      type: 'error'
    };

    if (error instanceof HttpErrorResponse) {
      // Server-side error
      if (error.status === 0) {
        errorMessage = {
          title: 'Network Error',
          message: 'Unable to connect to the server. Please check your internet connection.',
          type: 'error'
        };
      } else if (error.status === 401) {
        errorMessage = {
          title: 'Unauthorized',
          message: error.error?.message || 'Invalid credentials or session expired',
          type: 'warning'
        };
      } else if (error.status === 403) {
        errorMessage = {
          title: 'Forbidden',
          message: error.error?.message || 'You do not have permission to access this resource',
          type: 'warning'
        };
      } else if (error.status === 404) {
        errorMessage = {
          title: 'Not Found',
          message: error.error?.message || 'The requested resource was not found',
          type: 'warning'
        };
      } else if (error.status === 422) {
        // Validation errors
        const errors = error.error?.errors;
        const messages = this.extractValidationErrors(errors);
        errorMessage = {
          title: 'Validation Error',
          message: messages.join(', '),
          type: 'warning'
        };
      } else if (error.status === 429) {
        errorMessage = {
          title: 'Too Many Requests',
          message: error.error?.message || 'Too many requests. Please try again later.',
          type: 'warning'
        };
      } else if (error.status >= 500) {
        errorMessage = {
          title: 'Server Error',
          message: error.error?.message || 'A server error occurred. Please try again later.',
          type: 'error'
        };
      } else {
        errorMessage = {
          title: `Error ${error.status}`,
          message: error.error?.message || error.message || 'An error occurred',
          type: 'error'
        };
      }
    } else if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error: { message?: string } };
      if (err.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = {
          title: 'Client Error',
          message: err.error.message || 'A client error occurred',
          type: 'error'
        };
      }
    } else if (typeof error === 'string') {
      errorMessage = {
        title: 'Error',
        message: error,
        type: 'error'
      };
    }

    return errorMessage;
  }

  /**
   * Extract validation error messages
   */
  private extractValidationErrors(errors: unknown): string[] {
    const messages: string[] = [];
    
    if (errors && typeof errors === 'object') {
      const errorObj = errors as Record<string, string | string[]>;
      Object.keys(errorObj).forEach(key => {
        const errorArray = errorObj[key];
        if (Array.isArray(errorArray)) {
          messages.push(...errorArray);
        } else if (typeof errorArray === 'string') {
          messages.push(errorArray);
        }
      });
    }
    
    return messages.length > 0 ? messages : ['Validation failed'];
  }

  /**
   * Show error notification
   */
  showError(error: unknown, duration = 5000): void {
    const errorMsg = this.handleError(error);
    this.snackBar.open(errorMsg.message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show success notification
   */
  showSuccess(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show warning notification
   */
  showWarning(message: string, duration = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['warning-snackbar']
    });
  }

  /**
   * Show info notification
   */
  showInfo(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Log error to console in development
   */
  logError(error: unknown): void {
    console.error('Error occurred:', error);
  }
}

