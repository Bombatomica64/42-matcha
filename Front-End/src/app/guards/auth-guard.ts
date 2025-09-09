import { inject } from '@angular/core/primitives/di';
import { type CanActivateFn, Router } from '@angular/router';
import { TokenStore } from '../services/token-store';
// import { PLATFORM_ID } from '@angular/core';
// import { isPlatformServer } from '@angular/common';

export const authGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const tokenStore = inject(TokenStore);
  const isServer = typeof window === 'undefined';
  if (isServer) {
    // TokenStore already tried to hydrate from cookie; just check logged in
    if (!tokenStore.isLoggedin()) return router.parseUrl('/login');
    return true;
  }


  // Browser path
  if (!tokenStore.isLoggedin()) {
    return router.parseUrl('/login');
  }
  return true;
};
