import { Component, input } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TagModule } from 'primeng/tag';
import type { components } from "../../../types/api";

type User = components["schemas"]["User"];

@Component({
	selector: "app-card",
	imports: [CardModule, ButtonModule, TagModule],
	template: `
      <img alt="Foto profilo" class="w-full" [src]="getMainPhotoUrl()" />

      <div class="card-body">
        <div class="info">
          <p-tag [style]="{ border: '2px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)'}">
              <div class="flex items-center gap-2 px-1">
                  <span class="text-base">
                      {{ user().first_name }} {{ user().last_name }}
                  </span>
              </div>
          </p-tag>

          <p class="bio">
          bio: <br>
          {{ user().bio || 'Nessuna bio disponibile' }}
          </p>
          <p><br>{{ calculateAge(user().birth_date) }} anni</p>
        </div>

        <div class="card-footer">
            <p-button label="Cancel" severity="secondary" class="w-full" [outlined]="true" styleClass="w-full" />
            <p-button label="Save" class="w-full" styleClass="w-full" />
        </div>
      </div>

  `,
	styles: `
  img {
    border-radius: 8px;
  }
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    z-index: 20 !important;
    background: #383737ff;
    border-radius: 8px;
  }
  .card-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1rem;
  }
  .card-footer {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
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
