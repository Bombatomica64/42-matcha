import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100dvh; /* piena viewport */
      width: 100%;
    }
    .app-page {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 1200px;
      flex: 1;
      min-height: 100%; /* riempie :host */
    }
    .app-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }
  `
})
export class App {
  protected readonly title = signal('Front-End');
}
