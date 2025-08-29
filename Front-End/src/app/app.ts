import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { MainSidebar } from "./components/sidebars/mainsidebar/main-sidebar";
import { TokenStore } from './services/token-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, MainSidebar],
  template: `
    <div class="app-sidebar">
      <app-navbar />
      @if (isLoggedIn()) {
        <app-main-sidebar />
      }
    </div>
    <div class="router-frame">
      <router-outlet ></router-outlet>
    </div>
    @if (isLoggedIn()) {
      <app-main-sidebar />
    } @else {
      <div style="width: 300px">
      </div>
    }
  `,
  styles: `
    app-main-sidebar {
      height: 100%;
      display: flex;
    }
    :host {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 1rem;
      gap: 1rem;
    }
    .router-frame {
      height: 100%;
      width: 100%;
      border: 1px solid var(--p-menu-border-color, #464646ff); //TODO capire perche' va in fallback quando isLoggedIn = false
      border-radius: 8px;
    }
    .app-sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `
})
export class App {
  private router = inject(Router);
  private tokenStore = inject(TokenStore);
  protected readonly title = signal('Front-End');
  isLoggedIn = signal(false);

  constructor() {
    // if (this.tokenStore.isLoggedin()) {
      this.isLoggedIn.set(true);
    // }
    
  }
}
