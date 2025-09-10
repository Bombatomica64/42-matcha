import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";

@Component({
	selector: "app-landing",
	imports: [ButtonModule, RouterLink],
	template: `
    <p>
      benvenuto in questo bellissimo sito di incontri
    </p>
	<button pButton
        class="nav-register-btn"
		routerLink='/register'
        label='register'
        severity="secondary">
	</button>
  `,
	styles: ``,
})
export class Landing {}
