import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStore } from '../services/token-store';
import { inject } from '@angular/core';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    console.log('Skipping token attachment for auth endpoints');
    return next(req);
  }

  const accessToken = inject(TokenStore).getAccessToken();
  console.log(req.url);
  if (!accessToken) {
    return next(req);
  }
  const reqWithToken = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
    withCredentials: true
  });
  return next(reqWithToken);
};
