import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import type { Observable } from 'rxjs';
import type { paths, components } from '../../types/api';
import { environment } from '../../environments/environment';
import { isPlatformServer } from '@angular/common';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type HttpEndpoint = keyof paths;
export type PaginationQuery = components['schemas']['PaginationQuery'];

@Injectable({
	providedIn: 'root'
})
export class HttpRequestService {
	private http = inject(HttpClient);
	private clientUrl = environment.apiUrl ?? 'http://localhost:3000';
	private serverUrl = environment.serverApiUrl ?? 'http://backend:3000';
	private platformId = inject(PLATFORM_ID);

	request(credentials: any, httpEndpoint: HttpEndpoint, httpMethod: HttpMethod): Observable<any> {
		return this.http.request(httpMethod, this.getUrl(httpEndpoint), { body: credentials });
	}

	//nobody
	requestParams(
		queryParams: any,
		httpEndpoint: HttpEndpoint,
		httpMethod: HttpMethod,
	): Observable<any> {
		return this.http.request(httpMethod, this.getUrl(httpEndpoint), { params: queryParams });
	}
	private isServer(): boolean {
		return isPlatformServer(this.platformId);
	}

	private getUrl(httpEndpoint: HttpEndpoint): string {
		return this.isServer() ? `${this.serverUrl}${httpEndpoint}` : `${this.clientUrl}${httpEndpoint}`;
	}
}
