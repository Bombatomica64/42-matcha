import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  template: `
	<div class="app-page">
		<app-navbar />
		<router-outlet />
	</div>
  `,
  styleUrl: './app.scss',
  styles: `
	:host {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	}
	.app-page {
	  width: 100%;
	  height: 100%;
	  max-width: 1200px;
	}
  `
})
export class App {
  protected readonly title = signal('Front-End');
}
