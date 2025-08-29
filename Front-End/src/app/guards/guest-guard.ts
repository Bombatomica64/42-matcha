import { CanActivateFn, Router } from '@angular/router';
import { TokenStore } from '../services/token-store';
import { inject } from '@angular/core/primitives/di';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const tokenStore = inject(TokenStore);

  if (tokenStore.isLoggedin()) {
    router.navigate(['/home']);
    return false;
  }
  return true;
};
