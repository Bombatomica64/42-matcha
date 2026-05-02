import { Component, input } from "@angular/core";
import type { components } from "../../../types/api";

type User = components["schemas"]["User"];


@Component({
	selector: "app-card",
	imports: [],
	template: `
      <img alt="Foto profilo" [src]="getMainPhotoUrl()" />
      <div class="overlay">
        <span class="name">{{ user().first_name }} {{ user().last_name }}</span>
        <span class="age">{{ calculateAge(user().birth_date) }} anni</span>
      </div>
  `,
	styles: `
  :host {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    z-index: 20;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 8px;
  }
  .overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.5rem 1rem 1rem;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    border-radius: 0 0 8px 8px;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    color: #fff;
  }
  .name {
    font-size: 1.25rem;
    font-weight: 600;
  }
  .age {
    font-size: 1rem;
    opacity: 0.9;
  }
  `,
})
export class Card {
	user = input.required<User>();

	getMainPhotoUrl(): string {
		const mainPhoto = this.user().photos?.find((photo) => photo.is_main);
		return mainPhoto?.image_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNlHxpViduYZdKNiOmJRnkvFnKf88RcG-Edg&s";
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
