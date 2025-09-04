import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStore } from '../services/token-store';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
	if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
		console.log('Skipping token attachment for auth endpoints');
		return next(req);
	}

//   const accessToken = inject(TokenStore).getAccessToken();
//   console.log(req.url);
//   if (!accessToken) {
//     return next(req);
//   }
//   console.log('Attaching token to request:', accessToken);
//   const reqWithToken = req.clone({
//     headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
//     withCredentials: true
//   });
//   return next(reqWithToken);
	const platformId = inject(PLATFORM_ID);
	const tokenStore = inject(TokenStore);

	// Only attach tokens in browser environment
	if (isPlatformBrowser(platformId)) {
		const accessToken = tokenStore.getAccessToken();
		console.log(req.url);
		if (!accessToken) {
			return next(req);
		}
		console.log('Attaching token to request:', accessToken);
		const reqWithToken = req.clone({
			headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
			withCredentials: true
		});
		return next(reqWithToken);
	}

	// On server, continue without token (SSR pages should be public or handle auth differently)
	console.log('SSR request without token:', req.url);
	return next(req);
};
