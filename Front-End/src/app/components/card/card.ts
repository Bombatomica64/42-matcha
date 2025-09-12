import { Component, input } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import type { components } from "../../../types/api";

type User = components["schemas"]["User"];

@Component({
	selector: "app-card",
	imports: [CardModule, ButtonModule],
	template: `
    <p-card [style]="{ width: '25rem', overflow: 'hidden', height: '100%' }">
      <ng-template #header>
          <img alt="Foto profilo" class="w-full" [src]="getMainPhotoUrl()" />
      </ng-template>
      <ng-template #title>{{ user().first_name }} {{ user().last_name }}</ng-template>
      <ng-template #subtitle>Età: {{ calculateAge(user().birth_date) }}</ng-template>
      <p class="bio">
        {{ user().bio || 'Nessuna bio disponibile' }}
      </p>
      <ng-template #footer>
          <div class="flex gap-4 mt-1">
              <p-button label="Cancel" severity="secondary" class="w-full" [outlined]="true" styleClass="w-full" />
              <p-button label="Save" class="w-full" styleClass="w-full" />
          </div>
      </ng-template>
    </p-card>
  `,
	styles: `

  `,
})
export class Card {
	user = input.required<User>();

	// Metodo per ottenere l'URL della foto principale
	getMainPhotoUrl(): string {
		const mainPhoto = this.user().photos?.find((photo) => photo.is_main);
		return (
			mainPhoto?.image_url ||
			"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNlHxpViduYZdKNiOmJRnkvFnKf88RcG-Edg&s"
		); // Placeholder se non c'è foto
	}

	// Metodo per calcolare l'età (opzionale, basato su birth_date)
	calculateAge(birthDate?: string): number | string {
		if (!birthDate) return "N/A";
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birth.getDate())
		) {
			age--;
		}
		return age;
	}
}
