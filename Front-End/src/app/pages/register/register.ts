import { Component } from "@angular/core";
import { RegisterForm } from "../../components/forms/register-form/register-form";

@Component({
	selector: "app-register",
	imports: [RegisterForm],
	template: `
  <div class="login-container">
	<p>Register</p>
  	<app-register-form></app-register-form>
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
      max-width: 600px;
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
export class Register {}
