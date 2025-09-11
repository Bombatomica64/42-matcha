//import { ToggleButton } from 'primeng/togglebutton';
//import { IconField } from 'primeng/iconfield';
//import { InputIcon } from 'primeng/inputicon';
import { CommonModule } from "@angular/common";
import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	inject,
	OnDestroy,
} from "@angular/core";
import {
	type AbstractControl,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	type ValidatorFn,
	Validators,
} from "@angular/forms";
import { AutoFocusModule } from "primeng/autofocus";
import { ButtonModule } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { StepperModule } from "primeng/stepper";
import { TextareaModule } from "primeng/textarea";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import type { components } from "../../../../types/api"; // Adjust the path as necessary
import { Geolocation } from "../../../services/geolocation";
import {
	type HttpEndpoint,
	type HttpMethod,
	HttpRequestService,
} from "../../../services/http-request";
import { MapComponent } from "../../map/map";

type RegisterRequest = components["schemas"]["RegisterRequest"];
type RegisterResponse = components["schemas"]["RegisterResponse"];
type SexualOrientation = RegisterRequest["sexual_orientation"];
type Gender = RegisterRequest["gender"];

export function adultValidator(minAge: number): ValidatorFn {
	return (control: AbstractControl | null) => {
		const v = control?.value;
		if (!v) return { required: true };
		const date = v instanceof Date ? v : new Date(v);
		if (isNaN(date.getTime())) return { invalidDate: true };

		const today = new Date();
		let age = today.getFullYear() - date.getFullYear();
		const m = today.getMonth() - date.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
			age--;
		}

		return age >= minAge
			? null
			: { underage: { requiredAge: minAge, actualAge: age } };
	};
}

@Component({
	selector: "app-register-form",
	imports: [
		ReactiveFormsModule,
		InputTextModule,
		InputGroupModule,
		InputGroupAddonModule,
		ButtonModule,
		ToggleSwitchModule,
		TextareaModule,
		SelectModule,
		StepperModule,
		CommonModule,
		MessageModule,
		DatePickerModule,
		MapComponent,
		AutoFocusModule,
	],
	templateUrl: "./register-form.html",
	styles: `
 	.register-btn {
	  width: 100%;
	  margin-bottom: 2rem;
	}
	.p-step-panels {
	  height: 420px !important;
	}
	:host {
		--stepper-panels-height: 420px !important;
	}
	:host ::ng-deep .p-stepper-panels {
      flex: 0 0 420px; /* altezza fissa */
      height: 420px;
      overflow: auto; /* scroll interno se il contenuto supera l'altezza */
      position: relative;
    }
	.step-content {
	  display: flex;
	  flex-direction: column;
	  gap: 1rem;
	  margin: 0 auto;
	  min-height: 16rem;
	  max-width: 24rem;
	  overflow-y: auto;
	  height: 300px;
	}
  .location {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: nowrap;
  }

  .location > legend {
    margin: 0;
    padding-right: 0.5rem;
    flex: 0 0 auto;
  }

  .location .location-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex: 1 1 auto;
  }

  .location .manual-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  `,
})
export class RegisterForm {
	// add activeStep used by the template's p-stepper
	activeStep = 1;

	httpEndpoint: HttpEndpoint = "/auth/register";
	httpMethod: HttpMethod = "POST";

	registerForm = new FormGroup({
		username: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required],
		}),
		email: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required, Validators.email],
		}),
		password: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required, Validators.minLength(6)],
		}),
		first_name: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required],
		}),
		last_name: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required],
		}),
		birth_date: new FormControl<Date | null>(null, {
			nonNullable: true,
			validators: [Validators.required, adultValidator(18)],
		}),
		bio: new FormControl("", { nonNullable: true }),

		location: new FormGroup({
			lat: new FormControl<number | null>(null),
			lng: new FormControl<number | null>(null),
		}),

		location_manual: new FormControl<boolean>(false, { nonNullable: true }),
		sexual_orientation: new FormControl<
			"heterosexual" | "homosexual" | "bisexual" | ""
		>("", { nonNullable: true, validators: [Validators.required] }),
		gender: new FormControl<"male" | "female" | "other" | "">("", {
			nonNullable: true,
			validators: [Validators.required],
		}),
	});

	// inject ChangeDetectorRef to stabilize change detection after async updates
	cdr = inject(ChangeDetectorRef);

	getMyLocation() {
		this.geo
			.getLocation()
			.then((loc) => {
				const lat = loc.location.latitude;
				const lng = loc.location.longitude;
				// defer patch to next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError
				setTimeout(() => {
					this.registerForm.get("location")?.patchValue({ lat, lng });
					this.cdr.detectChanges();
				}, 0);
			})
			.catch((error) => {
				console.error("Error getting location:", error);
			});
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	onSubmit() {
		if (this.registerForm.valid) {
			const raw = this.registerForm.value;
			const birth_date: string = raw.birth_date
				? this.formatDate(raw.birth_date)
				: "";

			const payload: RegisterRequest = {
				username: raw.username!,
				email: raw.email!,
				password: raw.password!,
				first_name: raw.first_name!,
				last_name: raw.last_name!,
				birth_date,
				bio: raw.bio || undefined,
				location: { lat: raw.location!.lat!, lng: raw.location!.lng! },
				location_manual: raw.location_manual!,
				sexual_orientation:
					raw.sexual_orientation as RegisterRequest["sexual_orientation"],
				gender: raw.gender as RegisterRequest["gender"],
			};

			this.auth.request(payload, this.httpEndpoint, this.httpMethod).subscribe({
				next: (response: RegisterResponse) => {
					console.log("Register success:", response);
				},
				error: (error) => {
					console.error("Register error:", error);
				},
			});
		} else {
			console.error("Form is invalid");
		}
	}

	// Patch location when Map component emits a new position
	onLocationChange(ev: { lat: number; lng: number }) {
		// defer UI/model update to next macrotask (map may emit during component init)
		setTimeout(() => {
			this.registerForm
				.get("location")
				?.patchValue({ lat: ev.lat, lng: ev.lng });
			this.cdr.detectChanges();
		}, 0);
	}

	auth = inject(HttpRequestService);
	geo = inject(Geolocation);

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
}
