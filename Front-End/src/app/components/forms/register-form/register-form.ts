import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../../../services/http-request';
import { components } from '../../../../types/api'; // Adjust the path as necessary

import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

import { StepperModule } from 'primeng/stepper';
//import { ToggleButton } from 'primeng/togglebutton';
//import { IconField } from 'primeng/iconfield';
//import { InputIcon } from 'primeng/inputicon';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';

type RegisterRequest = components['schemas']['RegisterRequest'];
type RegisterResponse = components['schemas']['RegisterResponse'];

//function minAgeDateValidator(min: number): ValidatorFn {
//  return (control: AbstractControl) => {
//    const v = control.value;
//    if (!v) return { required: true };
//    if (!(v instanceof Date)) return { invalidDate: true };
//    const today = new Date();
//    let age = today.getFullYear() - v.getFullYear();
//    const m = today.getMonth() - v.getMonth();
//    if (m < 0 || (m === 0 && today.getDate() < v.getDate())) age--;
//    return age >= min ? null : { minAge: { required: min, actual: age } };
//  };
//}

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule, InputTextModule, InputGroupModule, InputGroupAddonModule, ButtonModule, ToggleSwitchModule, TextareaModule, SelectModule, StepperModule, CommonModule, MessageModule, DatePickerModule],
  templateUrl: './register-form.html',
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
  `
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

  activeStep: number = 1;

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