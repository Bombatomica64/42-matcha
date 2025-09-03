import { Component, inject, signal } from '@angular/core';
import { GetUserProfile } from '../../services/user/get-user-profile';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-profile',
  imports: [CardModule, ButtonModule],
  template: `
    <div style="display: flex; flex-direction: column;">
      <p>Email: {{ profileService.profile()?.email }}</p>
      <p>UserName: {{ profileService.profile()?.name }}</p>
      <p>Birth Date: {{ profileService.profile()?.birth_date }}</p>
      <p>Bio: {{ profileService.profile()?.bio }}</p>
      <p>First Name: {{ profileService.profile()?.first_name }}</p>
      <p>Last Name: {{ profileService.profile()?.last_name }}</p>
      <p>Gender: {{ profileService.profile()?.gender }}</p>
      <p>Sexual Orientation: {{ profileService.profile()?.sexual_orientation }}</p>
      <p>Location: {{ profileService.profile()?.location?.latitude }}, {{ profileService.profile()?.location?.longitude }}</p>
      <p>Fame Rating: {{ profileService.profile()?.fame_rating }} <!-- stelle da 0 a 5 --></p>
      <p>Online Status: {{ profileService.profile()?.online_status }}</p>
      <p>Likes Received: {{ profileService.profile()?.likes_received }}</p>
      <p>Views: {{ profileService.profile()?.views }}</p>
      <p>Matches: {{ profileService.profile()?.matches }}</p>
      <p>Photos: {{ profileService.profile()?.photos }}</p>
      <p>Hashtags: {{ profileService.profile()?.hashtags }}</p>
      <p-card [style]="{ width: '25rem', overflow: 'hidden', height: '100%' }">
        <ng-template #header>
          <img alt="Foto profilo" class="w-full" [src]="getMainPhotoUrl()" />
        </ng-template>
        <ng-template #title>{{ profileService.profile()?.first_name }} {{ profileService.profile()?.last_name }}</ng-template>
        <ng-template #subtitle>Età: {{ calculateAge(profileService.profile()?.birth_date) }}</ng-template>
        <p class="bio">
          {{ profileService.profile()?.bio || 'Nessuna bio disponibile' }}
        </p>
        <ng-template #footer>
          <div class="flex gap-4 mt-1">
            <p-button label="Cancel" severity="secondary" class="w-full" [outlined]="true" styleClass="w-full" />
            <p-button label="Save" class="w-full" styleClass="w-full" />
          </div>
        </ng-template>
      </p-card>
    </div>
  `,
  styles: ``
})
export class Profile {

  profileService = inject(GetUserProfile);

  // Metodo per ottenere l'URL della foto principale
  getMainPhotoUrl(): string {
    const photos = this.profileService.profile()?.photos;
    const mainPhoto = photos?.find(photo => photo.is_main);
    return mainPhoto?.image_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNlHxpViduYZdKNiOmJRnkvFnKf88RcG-Edg&s' || 'https://www.reddit.com/media?url=https%3A%2F%2Fpreview.redd.it%2Fpokemon-company-releasing-life-size-eeveelution-plushes-v0-98ft1tr8pvwe1.jpg%3Fwidth%3D640%26crop%3Dsmart%26auto%3Dwebp%26s%3D3239e42d1b8ab15657b75b4c55b46e557e161dc4';  // Placeholder se non c'è foto
  }

  // Metodo per calcolare l'età (opzionale, basato su birth_date)
  calculateAge(birthDate?: string): number | string {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

}

// type ProfileData = {
//     id?: string | undefined;
//     email?: string | undefined;
//     name?: string | undefined;
//     birth_date?: string | undefined;
//     bio?: string | undefined;
//     first_name?: string | undefined;
//     last_name?: string | undefined;
//     gender?: "male" | "female" | "other" | undefined;
//     sexual_orientation?: "heterosexual" | "homosexual" | "bisexual" | "other" | undefined;
//     location?: {
//         latitude?: number | undefined;
//         longitude?: number | undefined;
//     } | undefined;
//     fame_rating?: number | undefined;
//     online_status?: boolean | undefined;
//     likes_received?: number | undefined;
//     views?: number | undefined;
//     matches?: number | undefined;
//     photos?: {
//         ...;
//     }[] | undefined;
//     hashtags?: string[] | undefined;
// }
