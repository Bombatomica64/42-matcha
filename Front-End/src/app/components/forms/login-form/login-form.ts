import type { AfterViewInit } from "@angular/core";
import { Component, inject, output } from "@angular/core";
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";

import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import type { components } from "../../../../types/api"; // Adjust the path as necessary
import type { HttpEndpoint, HttpMethod } from "../../../services/http-request";
import { HttpRequestService } from "../../../services/http-request";

type LoginRequest = components["schemas"]["LoginRequest"];
type LoginResponse = components["schemas"]["LoginResponse"];

@Component({
	selector: "app-login-form",
	imports: [
		ReactiveFormsModule,
		InputGroupModule,
		InputGroupAddonModule,
		InputTextModule,
		ButtonModule,
		MessageModule,
	],
	template: `
  @let emailCtrl = loginForm.controls.email_or_username;
  @let pwdCtrl = loginForm.controls.password;

  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
	<div class="input-container">
		<p-inputgroup>
		<p-inputgroup-addon>
			<i class="pi pi-user"></i>
		</p-inputgroup-addon>
		<input pInputText formControlName="email_or_username"
			name="username"
			autocomplete="username"
			placeholder="Email o Username"
			aria-label="Email o Username" />
		</p-inputgroup>
		@if (emailCtrl.touched && emailCtrl.invalid) {
			<p-message severity="error" variant="simple" size="small">
				@if (emailCtrl.hasError('required')) { <div style="margin-left: 3rem">Campo obbligatorio. </div> }
			</p-message>
		}
	</div>

	<div class="input-container">
		<p-inputgroup>
		<p-inputgroup-addon>
			<i class="pi pi-lock"></i>
		</p-inputgroup-addon>
		<input pInputText type="password"
			formControlName="password"
			name="password"
			autocomplete="current-password"
			placeholder="Password"
			aria-label="Password" />
		</p-inputgroup>
		@if (pwdCtrl.touched && pwdCtrl.invalid) {
			<p-message severity="error" variant="simple" size="small">
				@if (pwdCtrl.hasError('required')) { <div style="margin-left: 3rem">Campo obbligatorio. </div> }
				@if (pwdCtrl.hasError('minlength')) { <div style="margin-left: 3rem">Minimo 6 caratteri. </div> }
			</p-message>
		}
	</div>

    <button pButton
        type="submit"
        class="login-btn"
        [disabled]="loginForm.invalid"
        severity="primary">
      <i class="pi pi-sign-in" pButtonIcon></i>
      <span pButtonLabel>Login</span>
    </button>
  </form>
  `,
	styles: `
    :host {
	  display: flex;
	  flex-direction: column;
	  align-items: stretch;
	  justify-content: center;
	  height: 100%;
	}
	.login-btn {
	  width: 100%;
	  margin-bottom: 2rem;
	}
	.input-container {
		display: flex;
		flex-direction: column;
		margin-bottom: 1rem;
	}
  `,
})
export class LoginForm implements AfterViewInit {
	httpEndpoint: HttpEndpoint = "/auth/login";
	httpMethod: HttpMethod = "POST";

	loginForm = new FormGroup({
		email_or_username: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required],
		}),
		password: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required, Validators.minLength(6)],
		}),
	});

	loginSuccess = output<LoginResponse>();
	loginError = output<unknown>();

	private autoSubmitAttempted = false;

	onSubmit() {
		if (this.loginForm.valid) {
			const credentials = this.loginForm.value as LoginRequest;
			console.log("Form submitted with:", credentials);

			this.auth
				.request(credentials, this.httpEndpoint, this.httpMethod)
				.subscribe({
					next: (response: LoginResponse) => {
						console.log("Login success:", response);
						this.loginSuccess.emit(response);
					},
					error: (error) => {
						console.error("Login error:", error);
						this.loginError.emit(error);
					},
				});
		} else {
			console.error("Form is invalid");
		}
	}

	auth = inject(HttpRequestService);

	ngAfterViewInit(): void {
		// Delay to allow browser autofill to populate fields
		setTimeout(() => this.tryAutoSubmit(), 250);
		// Fallback later attempt in case of slower autofill
		setTimeout(() => this.tryAutoSubmit(), 1000);
	}

	private tryAutoSubmit(): void {
		console.log("Attempting auto-submit check...");
		if (this.autoSubmitAttempted) return;
		const emailCtrl = this.loginForm.controls.email_or_username;
		const pwdCtrl = this.loginForm.controls.password;
		if (!emailCtrl || !pwdCtrl) return;
		const bothFilled = !!emailCtrl.value && !!pwdCtrl.value;
		const bothPristineUntouched =
			emailCtrl.pristine &&
			pwdCtrl.pristine &&
			!emailCtrl.touched &&
			!pwdCtrl.touched;
		if (bothFilled && this.loginForm.valid && bothPristineUntouched) {
			this.autoSubmitAttempted = true;
			this.onSubmit();
		}
	}
}
