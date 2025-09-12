import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import type { components } from "../../../types/api"; // Adjust the path as necessary
import { LoginForm } from "../../components/forms/login-form/login-form";
import { TokenStore } from "../../services/token-store";

type LoginResponse = components["schemas"]["LoginResponse"];
type ErrorResponse = components["schemas"]["ErrorResponse"];
@Component({
	selector: "app-login",
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
  `,
})
export class Login {
	private router = inject(Router);
	private tkn = inject(TokenStore);

	onLoginSuccess(response: LoginResponse) {
		console.log("Login successful:", response);
		this.tkn.setTokens(response.token);
		this.router.navigate(["/home"]);
	}
	onLoginError(error: ErrorResponse) {
		console.error("Login failed:", error);
		throw new Error(`Login failed MARCO METTI UN POP UP QUI: ${error.message}`);
	}
}
