import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { CompanyAuthService } from '../services/company-auth.service';

export const companyAuthGuard: CanActivateFn = (route, state) => {
  const companyAuthService = inject(CompanyAuthService);
  const router = inject(Router);

  if (companyAuthService.checkAuth()) {
    return true;
  }

  router.navigate(['/company-portal/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

