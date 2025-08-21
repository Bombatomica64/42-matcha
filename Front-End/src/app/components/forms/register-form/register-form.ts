import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../../../services/http-request';
import { components } from '../../../../types/api'; // Adjust the path as necessary
import { PrimaryButton } from '../../ui/primary-button/primary-button';

import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

type RegisterRequest = components['schemas']['RegisterRequest'];
type RegisterResponse = components['schemas']['RegisterResponse'];

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule, PrimaryButton, InputTextModule, InputGroupModule, InputGroupAddonModule, ButtonModule, ToggleSwitchModule, TextareaModule, SelectModule],
  template: `
  <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">

    <p-inputgroup>
      <p-inputgroup-addon>
        <i class="pi pi-user"></i>
      </p-inputgroup-addon>
      <input pInputText formControlName="username"
             placeholder="Username"
             aria-label="Username" />
    </p-inputgroup>

	<p-inputgroup>
	  <p-inputgroup-addon>
		<i class="pi pi-envelope"></i>
	  </p-inputgroup-addon>
	  <input pInputText type="email"
			 formControlName="email"
			 placeholder="Email"
			 aria-label="Email" />
	</p-inputgroup>

	<p-inputgroup>
	  <p-inputgroup-addon>
		<i class="pi pi-lock"></i>
	  </p-inputgroup-addon>
	  <input pInputText type="password"
			 formControlName="password"
			 placeholder="Password"
			 aria-label="Password" />
	</p-inputgroup>

	<p-inputgroup>
	  <p-inputgroup-addon>
		<i class="pi pi-user"></i>
	  </p-inputgroup-addon>
	  <input pInputText type="text"
			 formControlName="first_name"
			 placeholder="First Name"
			 aria-label="First Name" />
	</p-inputgroup>

    <p-inputgroup>
      <p-inputgroup-addon>
		<i class="pi pi-user"></i>
	  </p-inputgroup-addon>
      <input pInputText type="text"
			 formControlName="last_name"
			 placeholder="Last Name"
			 aria-label="Last Name" />
	</p-inputgroup>

    <p-inputgroup>
      <p-inputgroup-addon>
		<i class="pi pi-calendar"></i>
	  </p-inputgroup-addon>
      <input pInputText type="number"
			 formControlName="age"
			 placeholder="Age"
			 aria-label="Age" />
	</p-inputgroup>

    <p-inputgroup>
      <p-inputgroup-addon>
        <i class="pi pi-pencil"></i>
      </p-inputgroup-addon>
      <textarea
        pTextarea
        formControlName="bio"
        placeholder="Bio"
        aria-label="Bio"
        rows="3"
        style="width:100%;resize:vertical;"></textarea>
    </p-inputgroup>
    
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
	  <p-toggleswitch formControlName="location_manual" />
    </label>
    
    <label>
      Sexual Orientation:
	  <p-select
	    formControlName="sexual_orientation" 
	    [options]="orientationOptions"
		optionLabel="label"
		optionValue="value" 
	    placeholder="I like Trains"
		class="w-full md:w-56" />
    </label>

    <label>
      Gender:
      <p-select
        formControlName="gender"
        [options]="genderOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Fluid">
      </p-select>
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

  orientationOptions = [
    { label: 'Heterosexual', value: 'heterosexual' },
    { label: 'Homosexual', value: 'homosexual' },
    { label: 'Bisexual', value: 'bisexual' }
  ];
  genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ];
}