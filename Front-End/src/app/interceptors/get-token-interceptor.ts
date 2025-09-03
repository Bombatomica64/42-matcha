import { HttpEvent, HttpEventType, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { TokenStore } from '../services/token-store';
import { inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { components } from '../../types/api';

export type LoginResponse = components['schemas']['LoginResponse'];

export const getTokenInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const tkn = inject(TokenStore);

  return next(req).pipe(tap((event: HttpEvent<unknown>) => {
    if (event.type === HttpEventType.Response) {
      console.log(req.url, 'returned a response with status', event.status);
      //prendere il token dalla response
      const body = event.body as LoginResponse | undefined;
      const token = body?.token;
      console.log('Extracted token:', token);
      if (token) {
        tkn.setTokens(token);
      }
    }
  }));
};
