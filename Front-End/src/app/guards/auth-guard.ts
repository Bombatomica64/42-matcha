import { inject } from '@angular/core/primitives/di';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStore } from '../services/token-store';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const tokenStore = inject(TokenStore);

  if (!tokenStore.isLoggedin()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
