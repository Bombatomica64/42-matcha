import type { HttpInterceptorFn } from '@angular/common/http';
import { TokenStore } from '../services/token-store';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

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

	// On server, attempt to forward incoming Authorization header or cookie
	if (isPlatformServer(platformId)) {
		// Optional: look for global shims set by your SSR adapter
		const g = globalThis as unknown as { __REQ_AUTH_HEADER?: string; __REQ_COOKIE_HEADER?: string };
		let token: string | undefined;
		const headerAuth = g.__REQ_AUTH_HEADER;
		if (headerAuth?.toLowerCase().startsWith('bearer ')) {
			token = headerAuth.substring(7).trim();
		} else {
			const cookie = g.__REQ_COOKIE_HEADER;
			const match = cookie ? /access_token=([^;]+)/.exec(cookie) : null;
			if (match) token = decodeURIComponent(match[1]);
		}
		if (token) {
			const reqWithToken = req.clone({
				headers: req.headers.set('Authorization', `Bearer ${token}`),
				withCredentials: true
			});
			return next(reqWithToken);
		}
	}
	return next(req);
};
