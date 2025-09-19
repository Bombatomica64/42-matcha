import { isPlatformServer } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import type { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import type { components, paths } from "../../types/api";

export type HttpMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "DELETE"
	| "PATCH"
	| "HEAD"
	| "OPTIONS";
export type HttpEndpoint = keyof paths;
export type PaginationQuery = components["schemas"]["PaginationQuery"];

@Injectable({
	providedIn: "root",
})
export class HttpRequestService {
	private http = inject(HttpClient);
	private clientUrl = environment.apiUrl ?? "http://localhost:3000";
	private serverUrl = environment.serverApiUrl ?? "http://backend:3000";
	private platformId = inject(PLATFORM_ID);

	/**
	 * Generic request wrapper.
	 * Usage examples:
	 *  this.api.request<"/auth/login","POST">({ email, password }, "/auth/login", "POST").subscribe(...)
	 *  this.api.request<"/chat/user","GET">(undefined, "/chat/user", "GET").subscribe(...)
	 * If you need a specific response type override, pass it as the third generic arg:
	 *  this.api.request<"/chat/user","GET",MyResponseType>(null, "/chat/user", "GET")
	 */
	request<
		EP extends HttpEndpoint,
		M extends HttpMethod,
		TRes = ResponseBody<Operation<EP, M>>,
		TReq = RequestBody<Operation<EP, M>>,
	>(
		credentials: TReq | undefined | null,
		httpEndpoint: EP,
		httpMethod: M,
	): Observable<TRes> {
			return this.http.request<TRes>(
				httpMethod,
				this.getUrl(httpEndpoint),
				credentials === undefined || credentials === null
					? { withCredentials: true }
					: { body: credentials, withCredentials: true },
			);
	}

	// Query params helper (accepts object or pre-built string). If a string is passed it's appended directly.
	requestParams<
		EP extends HttpEndpoint,
		M extends HttpMethod,
		TQuery extends
			| Record<
					string,
					| string
					| number
					| boolean
					| readonly (string | number | boolean)[]
					| undefined
			  >
			| string,
		TRes = ResponseBody<Operation<EP, M>>,
	>(queryParams: TQuery, httpEndpoint: EP, httpMethod: M): Observable<TRes> {
		if (typeof queryParams === "string") {
			// Accept both starting with ? or raw key=val&... forms
			const qp = queryParams.startsWith("?") ? queryParams : `?${queryParams}`;
			return this.http.request<TRes>(
				httpMethod,
				`${this.getUrl(httpEndpoint)}${qp}`,
				{},
			);
		}
		// object path: filter undefined values
		const cleaned: Record<
			string,
			string | number | boolean | readonly (string | number | boolean)[]
		> = {};
		for (const k in queryParams) {
			const v = queryParams[k];
			if (v === undefined) continue;
			// Runtime guard to only keep allowed primitive / array values
			if (
				typeof v === "string" ||
				typeof v === "number" ||
				typeof v === "boolean" ||
				(Array.isArray(v) &&
					v.every((x) => ["string", "number", "boolean"].includes(typeof x)))
			) {
				cleaned[k] = v as (typeof cleaned)[string];
			}
		}
			return this.http.request<TRes>(httpMethod, this.getUrl(httpEndpoint), {
				params: cleaned,
				withCredentials: true,
			});
	}
	private isServer(): boolean {
		return isPlatformServer(this.platformId);
	}

	private getUrl(httpEndpoint: HttpEndpoint): string {
		const base = this.isServer() ? this.serverUrl : this.clientUrl;
		const full = `${base}${httpEndpoint}`;
		if (
			typeof window !== "undefined" &&
			(httpEndpoint as string).includes("/chat/") &&
			(httpEndpoint as string).includes("/messages")
		) {
			console.debug("[http] GET chat messages url", full);
		}
		return full;
	}
}

// ---- OpenAPI helper type utilities (best-effort extraction) ----
type Lower<M extends string> = M extends string ? Lowercase<M> : never;
type PathItem<EP extends HttpEndpoint> = EP extends keyof paths
	? paths[EP]
	: never;
type Operation<
	EP extends HttpEndpoint,
	M extends HttpMethod,
> = PathItem<EP> extends infer P
	? P extends { [k: string]: unknown }
		? Lower<M> extends keyof P
			? P[Lower<M>]
			: never
		: never
	: never;
// Extract JSON request body
type RequestBody<Op> = Op extends {
	requestBody: { content: { "application/json": infer B } };
}
	? B
	: unknown;
// Extract 200 JSON response (fallback to unknown)
type ResponseBody<Op> = Op extends { responses: infer R }
	? R extends { 200?: { content?: { "application/json": infer S } } }
		? S
		: unknown
	: unknown;
