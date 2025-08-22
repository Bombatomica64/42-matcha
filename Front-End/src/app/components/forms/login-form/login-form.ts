import { Component, inject } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../../../services/http-request';
import { components } from '../../../../types/api'; // Adjust the path as necessary

import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, InputGroupModule, InputGroupAddonModule, InputTextModule, ButtonModule, MessageModule],
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
				placeholder="Email o Username"
				aria-label="Email o Username" />
		</p-inputgroup>
		@if (emailCtrl.touched && emailCtrl.invalid) {
			<p-message severity="error" variant="simple" size="small" class="ml-12">
				@if (emailCtrl.hasError('required')) { Campo obbligatorio. }
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
				placeholder="Password"
				aria-label="Password" />
		</p-inputgroup>
		@if (pwdCtrl.touched && pwdCtrl.invalid) {
			<p-message severity="error" variant="simple" size="small" class="ml-12">
				@if (pwdCtrl.hasError('required')) { Campo obbligatorio. }
				@if (pwdCtrl.hasError('minlength')) { Minimo 6 caratteri. }
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
  `
})
export class LoginForm {
  httpEndpoint: HttpEndpoint = "/auth/login"
  httpMethod: HttpMethod = "POST"

  loginForm = new FormGroup({
	email_or_username: new FormControl('',  {nonNullable: true, validators: [Validators.required]}),
	password: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(6)]})
  });

  onSubmit() {
	if (this.loginForm.valid) {
	  const credentials = this.loginForm.value as LoginRequest;
	  console.log('Form submitted with:', credentials);

	  this.auth.request(credentials, this.httpEndpoint, this.httpMethod).subscribe({
      next: (response : LoginResponse) => {
        console.log('Login success:', response);
      },
      error: (error) => {
        console.error('Login error:', error);
      }
    });
	} else {
	  console.error('Form is invalid');
	}
  }

  auth = inject(HttpRequestService)
}

