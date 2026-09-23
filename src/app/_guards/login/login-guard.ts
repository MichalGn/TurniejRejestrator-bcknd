import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../../_services/auth/token-storage';
import { inject } from '@angular/core';

export const loginGuard: CanActivateFn = (route, state) => {
  const isAuthenticated = inject(TokenStorageService).getToken();
  return isAuthenticated ? true : inject(Router).createUrlTree(['/login']);
};
