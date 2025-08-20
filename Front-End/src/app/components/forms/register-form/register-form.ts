import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../../../services/http-request';
import { components } from '../../../../types/api'; // Adjust the path as necessary
import { PrimaryButton } from '../../ui/primary-button/primary-button';

type RegisterRequest = components['schemas']['RegisterRequest'];
type RegisterResponse = components['schemas']['RegisterResponse'];

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule, PrimaryButton],
  template: `
  <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
    <label>
      Username:
      <input type="text" formControlName="username"/>
    </label>
    <label>
      Email:
      <input type="email" formControlName="email"/>
    </label>
    <label>
      Password:
      <input type="password" formControlName="password"/>
    </label>
    <label>
      First Name:
      <input type="text" formControlName="first_name"/>
    </label>
    <label>
      Last Name:
      <input type="text" formControlName="last_name"/>
    </label>
    <label>
      Age:
      <input type="number" formControlName="age"/>
    </label>
    <label>
      Bio:
      <textarea formControlName="bio"></textarea>
    </label>
    
    <fieldset formGroupName="location">
      <legend>Location</legend>
      <label>
        Latitude:
        <input type="number" formControlName="lat" step="any"/>
      </label>
      <label>
        Longitude:
        <input type="number" formControlName="lng" step="any"/>
      </label>
    </fieldset>
    
    <label>
      Manual Location:
      <input type="checkbox" formControlName="location_manual"/>
    </label>
    
    <label>
      Sexual Orientation:
      <select formControlName="sexual_orientation">
        <option value="heterosexual">Heterosexual</option>
        <option value="homosexual">Homosexual</option>
        <option value="bisexual">Bisexual</option>
      </select>
    </label>
    
    <label>
      Gender:
      <select formControlName="gender">
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
    </label>
    <app-primary-button type="submit" [disabled]="registerForm.invalid" label="Register" (buttonClicked)="onSubmit()" />
  </form>
  `,
  styles: ``
})
export class RegisterForm {
  httpEndpoint: HttpEndpoint = "/auth/register"
  httpMethod: HttpMethod = "POST"

  registerForm = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    email: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(6)]}),
    first_name: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    last_name: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    age: new FormControl<number | null>(null, {nonNullable: true, validators: [Validators.required, Validators.min(18)]}),
    bio: new FormControl('', {nonNullable: true}),

    location: new FormGroup({
      lat: new FormControl<number | null>(null),
      lng: new FormControl<number | null>(null)
    }),

    location_manual: new FormControl<boolean>(false, {nonNullable: true}),
    sexual_orientation: new FormControl<'heterosexual' | 'homosexual' | 'bisexual' | ''>('', {nonNullable: true, validators: [Validators.required]}),
    gender: new FormControl<'male' | 'female' | 'other' | ''>('', {nonNullable: true, validators: [Validators.required]})
  });

  onSubmit() {
    if (this.registerForm.valid) {
      const credentials = this.registerForm.value as RegisterRequest;
      console.log('Form submitted with:', credentials);

      this.auth.request(credentials, this.httpEndpoint, this.httpMethod).subscribe({
        next: (response : RegisterResponse) => {
          console.log('Register success:', response);
        },
        error: (error) => {
          console.error('Register error:', error);
        }
      });
    } else {
      console.error('Form is invalid');
    }
  }

  auth = inject(HttpRequestService)
}