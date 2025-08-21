import { Component, inject } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../../../services/http-request';
import { components } from '../../../../types/api'; // Adjust the path as necessary
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';

type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, InputGroupModule, InputGroupAddonModule, InputTextModule, ButtonModule],
  template: `
  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
    <p-inputgroup>
      <p-inputgroup-addon>
        <i class="pi pi-user"></i>
      </p-inputgroup-addon>
      <input pInputText formControlName="email_or_username"
             placeholder="Email o Username"
             aria-label="Email o Username" />
    </p-inputgroup>
    <!--div class="error" *ngIf="loginForm.get('email_or_username')?.touched && loginForm.get('email_or_username')?.invalid">
      Campo obbligatorio.
    </div-->

    <p-inputgroup>
      <p-inputgroup-addon>
        <i class="pi pi-lock"></i>
      </p-inputgroup-addon>
      <input pInputText type="password"
             formControlName="password"
             placeholder="Password"
             aria-label="Password" />
    </p-inputgroup>
    <!--div class="error" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
      Minimo 6 caratteri.
    </div-->
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
	}
	.p-inputgroup {
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

