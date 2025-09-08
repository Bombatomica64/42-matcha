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

    private defaultUser: ProfileData = {
    id: '',
    email: '',
    name: '',
    birth_date: '',
    bio: '',
    first_name: '',
    last_name: '',
    gender: undefined,
    sexual_orientation: undefined,
    location: undefined,
    fame_rating: 0,
    online_status: false,
    likes_received: 0,
    views: 0,
    matches: 0,
    photos: [],
    hashtags: []
  };

  profile = signal<ProfileData>(this.defaultUser);

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
        this.profile.set({ ...this.defaultUser, bio: 'Errore nel caricamento del profilo' });
      }
    });
  }

  reloadProfile() {
    this.loadProfile();
  }
}
