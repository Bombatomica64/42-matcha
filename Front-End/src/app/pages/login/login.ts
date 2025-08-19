import { Component } from '@angular/core';
import { LoginForm } from '../../components/forms/login-form/login-form';

@Component({
  selector: 'app-login',
  imports: [LoginForm],
  template: `
	<p>Login</p>
	<app-login-form></app-login-form>
  `,
  styleUrl: './login.scss'
})
export class Login {

}
