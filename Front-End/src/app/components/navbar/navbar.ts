import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-navbar',
  imports: [ToolbarModule, ButtonModule, AvatarModule, NgOptimizedImage],
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
				<p-button label="Register" severity="secondary" />
			</div>
		</ng-template>
	</p-toolbar>
  `,
  styles: `
    .logoImg {
    }
	:host {
	  display: flex;
	  flex-direction: row;
	  align-items: center;
	  justify-content: space-between;
	  height: 100px;
	}
	::ng-deep .p-button
	{
		height: 66px !important;
		width: 120px !important;
		border-radius: 3rem !important;
	}
  `
})
export class Navbar {
}
