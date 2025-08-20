import { Component } from '@angular/core';
import { RegisterForm } from '../../components/forms/register-form/register-form';

@Component({
  selector: 'app-register',
  imports: [RegisterForm],
  template: `
  <app-register-form></app-register-form>
  `,
  styles: ``
})
export class Register {

}
