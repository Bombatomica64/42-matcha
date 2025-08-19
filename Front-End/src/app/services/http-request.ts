import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

@Injectable({
  providedIn: 'root'
})
export class HttpRequestService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';

  request(credentials: any, httpEndpoint: string, httpMethod: HttpMethod): Observable<any> {
    return this.http.request(httpMethod, `${this.baseUrl}${httpEndpoint}`, { body: credentials });
  }
}
