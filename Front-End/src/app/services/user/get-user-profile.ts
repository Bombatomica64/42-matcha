import { inject, Injectable, signal } from '@angular/core';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../http-request';
import { components, operations } from '../../../types/api';

type ProfileData = components['schemas']['User'];
type ErrorResponse = components['schemas']['ErrorResponse'];
// type DiscoverUsersResponse = operations['getUserProfile']['responses']['200']['content']['application/json'];

@Injectable({
  providedIn: 'root'
})
export class GetUserProfile {
  auth = inject(HttpRequestService);
  httpEndpoint: HttpEndpoint = "/users/profile";
  httpMethod: HttpMethod = "GET";
  params = "";

  profile = signal<ProfileData | null>(null);

  constructor() {
    console.log('ProfileService initialized');
    this.loadProfile();
  }

  private loadProfile() {
    this.auth.requestParams(
      this.params,
      this.httpEndpoint,
      this.httpMethod
    ).subscribe({
      next: (response: { user: ProfileData }) => {
        console.log(response);
        this.profile.set(response.user); // Salva la response nel signal
      },
      error: (error: ErrorResponse) => {
        console.error(error);
        this.profile.set(null); // Gestisci l'errore impostando null
      }
    });
  }

  reloadProfile() {
    this.loadProfile();
  }
}
