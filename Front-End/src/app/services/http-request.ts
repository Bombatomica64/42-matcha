import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpRequestService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';

  request(credentials: {email: string, password?: string}, httpEndpoint: string, httpMethod: string): Observable<any> {
    return this.http.request(httpMethod, `${this.baseUrl}${httpEndpoint}`, { body: credentials });
  }
}
