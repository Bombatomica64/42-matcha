import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
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
  styles: ``
})
export class Landing {

}
