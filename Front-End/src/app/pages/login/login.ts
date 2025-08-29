import { Component, inject } from '@angular/core';
import { LoginForm } from '../../components/forms/login-form/login-form';
import { Router } from '@angular/router';
import { TokenStore } from '../../services/token-store';

@Component({
  selector: 'app-login',
  imports: [LoginForm],
  template: `
  <div class="login-container">
    <p>Login</p>
    <app-login-form
      (loginSuccess)="onLoginSuccess($event)"
      (loginError)="onLoginError($event)">
    ></app-login-form>
  </div>
  `,
  styles: `
  :host {
      flex: 1;
      display: flex;
      min-height: 0;
  }
  .login-container {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      margin: auto; /* centra verticalmente e orizzontalmente nello spazio restante */
      padding: 0 1rem 5rem 1rem;
  }
  p {
      font-size: 2rem;
      margin: 0 0 1rem;
      text-align: center;
  }
  `
})
export class Login {
  private router = inject(Router);
  private tokenStore = inject(TokenStore);

  onLoginSuccess(response: any) {
    console.log('Login successful:', response);
    this.tokenStore.setTokens(response.token, "");
    this.router.navigate(['/home']);
  }
  onLoginError(error: any) {
    console.error('Login failed:', error);

  }

}
