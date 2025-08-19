import { Component, inject } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { HttpRequestService } from '../../../services/http-request';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule],
  template: `
  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
    <label for="email">
      Email:
      <input type="email" formControlName="email"/>
      <p>hai proprio scritto: {{ loginForm.value.email }}</p>
      <button type="submit" [disabled]="loginForm.invalid">Login</button>
    </label>
  </form>
  `,
  styles: ``
})
export class LoginForm {
  email = '';
  httpEndpoint = "/auth/login"
  httpMethod = "POST"

  loginForm = new FormGroup({
	email: new FormControl('', [Validators.required, Validators.email])
  });

  onSubmit() {
	if (this.loginForm.valid) {
	  const credentials = {
		email: this.loginForm.value.email ?? '',
		password: ''
	  };
	  console.log('Form submitted with email:', this.loginForm.value.email);
	  
	  this.auth.request(credentials, this.httpEndpoint, this.httpMethod).subscribe({
      next: (response) => {
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

  //protected readonly auth: HttpRequestService = inject(HttpRequestService);

  auth = inject(HttpRequestService)
}

