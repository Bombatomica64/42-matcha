import { NgOptimizedImage } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { ToolbarModule } from "primeng/toolbar";
import { ChatList } from "./components/chat-list/chat-list";
import { MainSidebar } from "./components/sidebars/mainsidebar/main-sidebar";
import { TokenStore } from "./services/token-store";

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    MainSidebar,
    ButtonModule,
    RouterLink,
    ToolbarModule,
    NgOptimizedImage,
    ChatList,
  ],
  template: `
  <div class="app-sidebar">
      @if (!isLoggedIn()) {
		<div class="flex items-center">
			<img ngSrc="images/logoConNome_noBackground.png" class="logoImg"
                 alt="Logo"
                 width="150"
                 height="150"
                 style="margin-bottom: 1rem"
                 priority />
			<!--p-button label="Files" text plain /-->
			<!--p-button label="Edit" text plain /-->
			<!--p-button label="View" text plain /-->
		</div>
	  }
      @if (isLoggedIn()) {
        <app-main-sidebar />
      }
    </div>
  <div class="router-frame">
      <router-outlet ></router-outlet>
    </div>
    @if (isLoggedIn()) {
      <app-chat-list />
    } @else {
		<div class="right-sidebar">
		<p-toolbar [style]="{ 'border-radius': '3rem', 'padding': '0rem', }">
			<ng-template #center>
				<div class="flex items-center gap-2">
					<button pButton
							class="nav-register-btn"
							[routerLink]="targetRoute"
							[label]="routeLabel"
							severity="secondary">
					</button>
				</div>
			</ng-template>
		</p-toolbar>
      </div>
    }
  `,
  styles: `
    app-main-sidebar {
      //height: 100%;
      display: flex;
	  flex-grow: 1;
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
      //border: 1px solid var(--p-menu-border-color, #464646ff); //TODO capire perche' va in fallback quando isLoggedIn = false
      border-radius: 8px;
	  background-color: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(0.2rem);
    }
    .app-sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
	  width: 300px;
    }
	.right-sidebar {
      width: 300px;
    height: 100%;
    display: flex;
    align-content: flex-start;
    justify-content: flex-end;
    align-items: flex-start;
    }
	.nav-register-btn {
        height: 66px;
        width: 120px;
        border-radius: 3rem;
    }
  `,
})
export class App {
  private router = inject(Router);
  private tokenStore = inject(TokenStore);
  protected readonly title = signal("Front-End");

  isLoggedIn = computed(() => {
    //TODO implement proper auth check through router
    // getAccessToken() already returns null for expired/invalid tokens
    return !!this.tokenStore.getAccessToken();
  });

  private get isRegister() {
    return this.router.url === "/register" || this.router.url === "/landing";
  }

  get targetRoute() {
    return this.isRegister ? "/login" : "/register";
  }

  get routeLabel() {
    return this.isRegister ? "Login" : "Register";
  }
}
