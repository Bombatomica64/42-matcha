import { NgOptimizedImage } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { ToolbarModule } from "primeng/toolbar";

@Component({
	selector: "app-navbar",
	imports: [
		ToolbarModule,
		ButtonModule,
		AvatarModule,
		NgOptimizedImage,
		RouterLink,
	],
	template: `
	<p-toolbar [style]="{ 'border-radius': '3rem', 'padding': '0.6rem', margin: '1rem', flex: '1' }">
		<ng-template #start>
			<div class="flex items-center gap-2">
				<img ngSrc="images/logoConNome_noBackground.png" class="logoImg"
                     alt="Logo"
                     width="150"
                     height="150"
                     style="margin-right: 1rem"
                     priority />
				<!--p-button label="Files" text plain /-->
				<!--p-button label="Edit" text plain /-->
				<!--p-button label="View" text plain /-->
			</div>
		</ng-template>
	</p-toolbar>

	<p-toolbar [style]="{ 'border-radius': '3rem', 'padding': '0rem', margin: '1rem', }">
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
  `,
	styles: `
	:host {
	  display: flex;
	  flex-direction: row;
	  align-items: center;
	  justify-content: space-between;
	  height: 100px;
	}
    .nav-register-btn {
        height: 66px;
        width: 120px;
        border-radius: 3rem;
    }
  `,
})
export class Navbar {
  private router = inject(Router);

	private get isRegister() {
		return this.router.url === "/register";
	}

	get targetRoute() {
		return this.isRegister ? "/login" : "/register";
	}

	get routeLabel() {
		return this.isRegister ? "Login" : "Register";
	}
}
