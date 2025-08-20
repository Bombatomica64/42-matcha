import { Component, inject } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../../../services/http-request';
import { components } from '../../../../types/api'; // Adjust the path as necessary
import { PrimaryButton } from '../../ui/primary-button/primary-button';

type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];

type LoginFormType = FormGroup<{
  [K in keyof LoginRequest]: FormControl<LoginRequest[K]>
}>;

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, PrimaryButton],
  template: `
  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
    <label for="email">
      Email or Username:
      <input type="text" formControlName="email_or_username"/>
	</label>
	<label for="password">
      Password:
      <input type="password" formControlName="password"/>
	</label>
    <app-primary-button type="submit" [disabled]="loginForm.invalid" label="Login" (buttonClicked)="onSubmit()" />
  </form>
  `,
  styles: ``
})
export class LoginForm {
  httpEndpoint: HttpEndpoint = "/auth/login"
  httpMethod: HttpMethod = "POST"

  loginForm: LoginFormType = new FormGroup({
	email_or_username: new FormControl('',  {nonNullable: true, validators: [Validators.required]}),
	password: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(6)]})
  });

  onSubmit() {
	if (this.loginForm.valid) {
	  const credentials = this.loginForm.value as LoginRequest;
	  console.log('Form submitted with email_or_username:', credentials.email_or_username);

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

