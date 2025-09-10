import {
	type HttpEvent,
	HttpEventType,
	type HttpHandlerFn,
	type HttpInterceptorFn,
	type HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { type Observable, tap } from "rxjs";
import type { components } from "../../types/api";
import { TokenStore } from "../services/token-store";

export type LoginResponse = components["schemas"]["LoginResponse"];

export const getTokenInterceptor: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
	const tkn = inject(TokenStore);

	return next(req).pipe(
		tap((event: HttpEvent<unknown>) => {
			if (event.type === HttpEventType.Response) {
				console.log(req.url, "returned a response with status", event.status);
				//prendere il token dalla response
				const body = event.body as LoginResponse | undefined;
				const token = body?.token;
				console.log("Extracted token:", token);
				if (token) {
					tkn.setTokens(token);
				}
			}
		}),
	);
};
