import {
	Component,
	ElementRef,
	effect,
	inject,
	input,
	output,
	signal,
	ViewChild,
} from "@angular/core";
import {
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DatePickerModule } from "primeng/datepicker";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import type { components, operations } from "../../../../types/api";
import {
	type HttpEndpoint,
	type HttpMethod,
	HttpRequestService,
} from "../../../services/http-request";
import { GetUserProfile } from "../../../services/user/get-user-profile";
import { MapComponent } from "../../map/map";
import { adultValidator } from "../register-form/register-form";

type User = components["schemas"]["User"];
type SexualOrientation = User["sexual_orientation"];
type Gender = User["gender"];
type ProfileData = components["schemas"]["User"];
type ErrorResponse = components["schemas"]["ErrorResponse"];

@Component({
	selector: "app-profile-form",
	imports: [
		CardModule,
		ButtonModule,
		InputGroupModule,
		InputGroupAddonModule,
		InputTextModule,
		DatePickerModule,
		FormsModule,
		ReactiveFormsModule,
		MapComponent,
		SelectModule,
	],
	template: `
      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
        <p>Email: {{ profileService.profile().email }}</p>
        <p-inputgroup>
          <input
            pInputText
            placeholder="Email"
            formControlName="email"
          />
          <p-inputgroup-addon>
            <p-button
              icon="pi pi-pencil"
              severity="secondary"
              variant="text"
              (click)="toggleEditable()"
            />
          </p-inputgroup-addon>
        </p-inputgroup>

        <p>Birth Date: {{ profileService.profile().birth_date }}</p>
        <p-inputgroup>
					<p-inputgroup-addon>
					<i class="pi pi-calendar"></i>
					</p-inputgroup-addon>
					<p-datepicker
					formControlName="birth_date"
					placeholder="Birth date"
					dateFormat="dd/mm/yy"
					appendTo="body"
					inputId="birth_date"
          [panelStyle]="{minWidth:'14rem'}">
					</p-datepicker>
				</p-inputgroup>

        <p>Bio: {{ profileService.profile().bio }}</p>
        <p-inputgroup>
          <input
            pInputText
            placeholder="Bio"
            formControlName="bio"
          />
          <p-inputgroup-addon>
            <p-button
              icon="pi pi-pencil"
              severity="secondary"
              variant="text"
            />
          </p-inputgroup-addon>
        </p-inputgroup>

        <p>First Name: {{ profileService.profile().first_name }}</p>
        <p-inputgroup>
          <input
            pInputText
            placeholder="First Name"
            formControlName="first_name"
          />
          <p-inputgroup-addon>
            <p-button
              icon="pi pi-pencil"
              severity="secondary"
              variant="text"
            />
          </p-inputgroup-addon>
        </p-inputgroup>

        <p>Last Name: {{ profileService.profile().last_name }}</p>
        <p-inputgroup>
          <input
            pInputText
            placeholder="Last Name"
            formControlName="last_name"
          />
          <p-inputgroup-addon>
            <p-button
              icon="pi pi-pencil"
              severity="secondary"
              variant="text"
            />
          </p-inputgroup-addon>
        </p-inputgroup>

        <p>Gender: {{ profileService.profile().gender }}</p>
        <p-select
          [formControl]="profileForm.controls.gender"
          [options]="genderOptions"
          optionLabel="label"
          optionValue="value"
          appendTo="body"
          placeholder="Fluid"
        >
        </p-select>
        <p>
          Sexual Orientation: {{ profileService.profile().sexual_orientation }}
        </p>
        <p-select
          [formControl]="profileForm.controls.sexual_orientation"
          [options]="orientationOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="I like Trains"
          appendTo="body"
        />

        <p>
          Location: {{ profileService.profile().location?.latitude }},
          {{ profileService.profile().location?.longitude }}
        </p>
        <div class="field">
          <app-map
            [lat]="profileService.profile().location?.latitude"
            [lng]="profileService.profile().location?.longitude"
            (locationChange)="onLocationChange($event)"
            [height]="'150px'"
            [width]="'100%'"
          ></app-map>
        </div>

        <button pButton
            type="submit"
            class="profile-btn"
            severity="primary">
          <i class="pi pi-sign-in" pButtonIcon></i>
          <span pButtonLabel>save</span>
        </button>

      </form>
  `,
	styles: ``,
})
export class ProfileForm {
	location = signal<{ latitude: number; longitude: number } | null>(null);

	isEditable = signal(false);

	profileService = inject(GetUserProfile);
	profile = this.profileService.profile();
	auth = inject(HttpRequestService);

	profileForm = new FormGroup({
		email: new FormControl("", {
			nonNullable: true,
			validators: [Validators.email],
		}),
		birth_date: new FormControl<Date | null>(null, {
			nonNullable: true,
			validators: [adultValidator(18)],
		}),
		bio: new FormControl("", { nonNullable: true }),
		first_name: new FormControl("", { nonNullable: true }),
		last_name: new FormControl("", { nonNullable: true }),
		gender: new FormControl<"male" | "female" | "other" | "">("", {
			nonNullable: true,
		}),
		sexual_orientation: new FormControl<
			"heterosexual" | "homosexual" | "bisexual" | ""
		>("", { nonNullable: true }),
		location: new FormGroup({
			lat: new FormControl<number | null>(null),
			lng: new FormControl<number | null>(null),
		}),
	});

	constructor() {
		// Effect per sincronizzare il signal location con il form
		effect(() => {
			const loc = this.location();
			if (loc) {
				this.profileForm
					.get("location")
					?.patchValue({ lat: loc.latitude, lng: loc.longitude });
			}
		});

		effect(() => {
			const profile = this.profileService.profile();
			const editable = this.isEditable();
			if (profile && !editable) {
				this.profileForm.patchValue({
					email: profile.email || "",
					birth_date: profile.birth_date ? new Date(profile.birth_date) : null,
					bio: profile.bio || "",
					first_name: profile.first_name || "",
					last_name: profile.last_name || "",
					gender: profile.gender || "",
					sexual_orientation:
						profile.sexual_orientation === "heterosexual" ||
						profile.sexual_orientation === "homosexual" ||
						profile.sexual_orientation === "bisexual"
							? profile.sexual_orientation
							: "",
					location: {
						lat: profile.location?.latitude || null,
						lng: profile.location?.longitude || null,
					},
				});
			}
			if (editable) {
				this.profileForm.enable();
			} else {
				this.profileForm.disable();
			}
		});
	}
	//hastag dopo
	//foto dopo

	toggleEditable() {
		this.isEditable.set(!this.isEditable());
	}

	// Metodo per ottenere l'URL della foto principale
	getMainPhotoUrl(): string {
		const photos = this.profileService.profile()?.photos;
		const mainPhoto = photos?.find((photo) => photo.is_main);

		return (
			mainPhoto?.image_url ||
			"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNlHxpViduYZdKNiOmJRnkvFnKf88RcG-Edg&s" ||
			"https://www.reddit.com/media?url=https%3A%2F%2Fpreview.redd.it%2Fpokemon-company-releasing-life-size-eeveelution-plushes-v0-98ft1tr8pvwe1.jpg%3Fwidth%3D640%26crop%3Dsmart%26auto%3Dwebp%26s%3D3239e42d1b8ab15657b75b4c55b46e557e161dc4"
		); // Placeholder se non c'è foto
	}

	// Metodo per calcolare l'età (opzionale, basato su birth_date)
	calculateAge(birthDate?: string): number | string {
		if (!birthDate) return "N/A";
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birth.getDate())
		) {
			age--;
		}
		return age;
	}

	orientationOptions: { label: string; value: SexualOrientation }[] = [
		{ label: "Heterosexual", value: "heterosexual" },
		{ label: "Homosexual", value: "homosexual" },
		{ label: "Bisexual", value: "bisexual" },
	];
	genderOptions: { label: string; value: Gender }[] = [
		{ label: "Male", value: "male" },
		{ label: "Female", value: "female" },
		{ label: "Other", value: "other" },
	];

	onLocationChange(ev: { lat: number; lng: number }) {
		this.location.set({ latitude: ev.lat, longitude: ev.lng });
	}

	httpEndpoint: HttpEndpoint = "/users/profile";
	httpMethod: HttpMethod = "PATCH";

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	onSubmit() {
		if (this.profileForm.valid) {
			const raw = this.profileForm.value;
			const profile = this.profileService.profile();
			if (!profile) return;

			const payload: Partial<User> = {};

			// Only send email if it's not empty and different
			if (raw.email && raw.email.trim() !== "" && raw.email !== profile.email) {
				payload.email = raw.email;
			}
			// Only send first_name if it's not empty and different
			if (
				raw.first_name &&
				raw.first_name.trim() !== "" &&
				raw.first_name !== profile.first_name
			) {
				payload.first_name = raw.first_name;
			}
			// Only send last_name if it's not empty and different
			if (
				raw.last_name &&
				raw.last_name.trim() !== "" &&
				raw.last_name !== profile.last_name
			) {
				payload.last_name = raw.last_name;
			}
			// Bio can be empty, so we handle it differently
			if (raw.bio !== profile.bio) {
				payload.bio = raw.bio || undefined;
			}
			if (raw.gender !== profile.gender) {
				payload.gender = raw.gender as User["gender"];
			}
			if (raw.sexual_orientation !== profile.sexual_orientation) {
				payload.sexual_orientation =
					raw.sexual_orientation as User["sexual_orientation"];
			}
			if (
				raw.birth_date &&
				this.formatDate(raw.birth_date) !== profile.birth_date
			) {
				payload.birth_date = this.formatDate(raw.birth_date);
			}
			if (
				raw.location?.lat !== profile.location?.latitude ||
				raw.location?.lng !== profile.location?.longitude
			) {
				payload.location = {
					latitude: raw.location!.lat!,
					longitude: raw.location!.lng!,
				};
			}

			if (Object.keys(payload).length === 0) {
				console.log("Nessun cambiamento rilevato.");
				return;
			}

			this.auth.request(payload, this.httpEndpoint, this.httpMethod).subscribe({
				next: (response: ProfileData) => {
					console.log("Update success:", response);
					this.profileService.reloadProfile();
					this.isEditable.set(false);
				},
				error: (error: ErrorResponse) => {
					console.error("Update error:", error);
				},
			});
		} else {
			console.error("Form is invalid");
		}
	}
}
