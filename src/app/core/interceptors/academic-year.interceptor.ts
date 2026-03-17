import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AcademicYearContextService } from '../services/academic-year-context.service';

export const academicYearInterceptor: HttpInterceptorFn = (req, next) => {
  const context = inject(AcademicYearContextService);
  const yearId = context.selectedYearId;

  if (yearId != null) {
    const cloned = req.clone({
      setHeaders: {
        'X-Academic-Year-Id': String(yearId)
      }
    });
    return next(cloned);
  }

  return next(req);
};
