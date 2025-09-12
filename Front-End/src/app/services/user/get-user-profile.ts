import { Injectable, inject, signal } from "@angular/core";
import type { components } from "../../../types/api";
import {
	type HttpEndpoint,
	type HttpMethod,
	HttpRequestService,
} from "../http-request";

type ProfileData = components["schemas"]["User"];
type ErrorResponse = components["schemas"]["ErrorResponse"];
// type DiscoverUsersResponse = operations['getUserProfile']['responses']['200']['content']['application/json'];

@Injectable({
	providedIn: "root",
})
export class GetUserProfile {
	auth = inject(HttpRequestService);
	httpEndpoint: HttpEndpoint = "/users/profile";
	httpMethod: HttpMethod = "GET";
	params = "";

	private defaultUser: ProfileData = {
		id: "",
		email: "",
		name: "",
		birth_date: "",
		bio: "",
		first_name: "",
		last_name: "",
		gender: undefined,
		sexual_orientation: undefined,
		location: undefined,
		fame_rating: 0,
		online_status: false,
		likes_received: 0,
		views: 0,
		matches: 0,
		photos: [],
		hashtags: [],
	};

	profile = signal<ProfileData>(this.defaultUser);

	constructor() {
		console.log("ProfileService initialized");
		this.loadProfile();
	}

	private loadProfile() {
		// If params string is empty, pass an empty object to preserve endpoint typing
		const qp = this.params ? this.params : {};
		this.auth
			.requestParams<
				typeof this.httpEndpoint,
				typeof this.httpMethod,
				typeof qp,
				{ user: ProfileData }
			>(qp, this.httpEndpoint, this.httpMethod)
			.subscribe({
				next: (response) => {
					console.log(response);
					if (response?.user) this.profile.set(response.user);
				},
				error: (error: ErrorResponse) => {
					console.error(error);
					this.profile.set({
						...this.defaultUser,
						bio: "Errore nel caricamento del profilo",
					});
				},
			});
	}

	reloadProfile() {
		this.loadProfile();
	}
}
