import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { paths } from '../../types/api';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type HttpEndpoint = keyof paths;

@Injectable({
  providedIn: 'root'
})
export class HttpRequestService {
  private http = inject(HttpClient);
  private baseUrl = 'https://localhost:8443/api';

  request(credentials: any, httpEndpoint: HttpEndpoint, httpMethod: HttpMethod): Observable<any> {
    return this.http.request(httpMethod, `${this.baseUrl}${httpEndpoint}`, { body: credentials });
  }
}
