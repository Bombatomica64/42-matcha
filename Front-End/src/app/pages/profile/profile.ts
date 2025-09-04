import { Component, effect, inject, signal } from '@angular/core';
import { GetUserProfile } from '../../services/user/get-user-profile';
import { Map } from '../../components/map/map';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs';
import { adultValidator } from '../../components/forms/register-form/register-form';
import { SelectModule } from 'primeng/select';
import { components } from '../../../types/api';

type RegisterRequest = components['schemas']['RegisterRequest'];
type SexualOrientation = RegisterRequest['sexual_orientation'];
type Gender = RegisterRequest['gender'];

@Component({
  selector: 'app-profile',
  imports: [CardModule, ButtonModule, InputGroupModule, InputGroupAddonModule, InputTextModule, SelectModule, Map],
  template: `
    <div style="padding: 1rem;">
      <p-card [style]="{ width: '20rem', overflow: 'hidden', height: '100%' }">
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
    <div style="display: flex; flex-direction: column; padding: 1rem;">
      <p>{{ profileService.profile()?.name }}</p><br>

      <p>Email: {{ profileService.profile()?.email }}</p>

      <p-inputgroup>
        <input pInputText placeholder="Email" [disabled]="isEditable()" formControlName="email"/>
        <p-inputgroup-addon>
            <p-button icon="pi pi-pencil" severity="secondary" variant="text" (onClick)="toggleEditable()" />
        </p-inputgroup-addon>
      </p-inputgroup>

      <p>Birth Date: {{ profileService.profile()?.birth_date }}</p>
      <p-inputgroup>
        <input pInputText placeholder="Birth Date" [disabled]="isEditable()" formControlName="birth_date"/>
        <p-inputgroup-addon>
            <p-button icon="pi pi-pencil" severity="secondary" variant="text" (onClick)="toggleEditable()" />
        </p-inputgroup-addon>
      </p-inputgroup>

      <p>Bio: {{ profileService.profile()?.bio }}</p>
      <p-inputgroup>
        <input pInputText placeholder="Bio" [disabled]="isEditable()" formControlName="bio"/>
        <p-inputgroup-addon>
            <p-button icon="pi pi-pencil" severity="secondary" variant="text" (onClick)="toggleEditable()" />
        </p-inputgroup-addon>
      </p-inputgroup>

      <p>First Name: {{ profileService.profile()?.first_name }}</p>
      <p-inputgroup>
        <input pInputText placeholder="First Name" [disabled]="isEditable()" formControlName="first_name"/>
        <p-inputgroup-addon>
            <p-button icon="pi pi-pencil" severity="secondary" variant="text" (onClick)="toggleEditable()" />
        </p-inputgroup-addon>
      </p-inputgroup>

      <p>Last Name: {{ profileService.profile()?.last_name }}</p>
      <p-inputgroup>
        <input pInputText placeholder="Last Name" [disabled]="isEditable()" formControlName="last_name"/>
        <p-inputgroup-addon>
            <p-button icon="pi pi-pencil" severity="secondary" variant="text" (onClick)="toggleEditable()" />
        </p-inputgroup-addon>
      </p-inputgroup>

      <p>Gender: {{ profileService.profile()?.gender }}</p>
      <p-select
        formControlName="gender"
        [options]="genderOptions"
        optionLabel="label"
        optionValue="value"
        appendTo="body"
        placeholder="Fluid"
      >
      </p-select>
      <p>Sexual Orientation: {{ profileService.profile()?.sexual_orientation }}</p>
      <p-select
        formControlName="sexual_orientation"
        [options]="orientationOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="I like Trains"
        appendTo="body"
      />

      <p>Location: {{ profileService.profile()?.location?.latitude }}, {{ profileService.profile()?.location?.longitude }}</p>
      <div class="field">
        <app-map
          [lat]="profileService.profile()?.location?.latitude"
          [lng]="profileService.profile()?.location?.longitude"
          (locationChange)="onLocationChange($event)"
          [height]="'150px'"
          [width]="'100%'"
        ></app-map>
      </div>
    </div>
    <div style="padding: 1rem;">
      <p>Hashtags: {{ profileService.profile()?.hashtags }}</p>
      <p>Photos: {{ profileService.profile()?.photos }}</p>

      <!-- <p>Online Status: {{ profileService.profile()?.online_status }}</p> -->
      <p>Fame Rating: {{ profileService.profile()?.fame_rating }} <!-- stelle da 0 a 5 --></p>
      <p>Likes Received: {{ profileService.profile()?.likes_received }}</p>
      <p>Views: {{ profileService.profile()?.views }}</p>
      <p>Matches: {{ profileService.profile()?.matches }}</p>
      change password
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: row;
      height: 100%;
      gap: 1rem;
    }
    :host > div:first-child {
      align-self: center; /* Centers the first child vertically */
      /* Other styles for the first div */
    }

    :host > div:last-child {
      /* Styles for the second div - it will stay at the top due to align-items: flex-start on the parent */
    }
  `
})
export class Profile {

  profileService = inject(GetUserProfile);
  isEditable = signal(false);
  location = signal<{ latitude: number; longitude: number } | null>(null);

  profileForm = new FormGroup({
	  email: new FormControl('',  {nonNullable: true, validators: [Validators.email]}),
	  birth_date: new FormControl<Date | null>(null, {nonNullable: true, validators: [adultValidator(18)]}),
    bio: new FormControl('', {nonNullable: true}),
    first_name: new FormControl('', {nonNullable: true}),
    last_name: new FormControl('', {nonNullable: true}),
    gender: new FormControl<'male' | 'female' | 'other' | ''>('', {nonNullable: true}),
    sexual_orientation: new FormControl<'heterosexual' | 'homosexual' | 'bisexual' | ''>('', {nonNullable: true}),
    location: new FormGroup({
      lat: new FormControl<number | null>(null),
      lng: new FormControl<number | null>(null)
    }),
  });

  constructor() {
    // Effect per sincronizzare il signal location con il form
    effect(() => {
      const loc = this.location();
      if (loc) {
        this.profileForm.get('location')?.patchValue({ lat: loc.latitude, lng: loc.longitude });
      }
    });
  }
  //hastag dopo
  //foto dopo

  // Metodo per ottenere l'URL della foto principale
  getMainPhotoUrl(): string {
    const photos = this.profileService.profile()?.photos;
    const mainPhoto = photos?.find(photo => photo.is_main);

    return mainPhoto?.image_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNlHxpViduYZdKNiOmJRnkvFnKf88RcG-Edg&s'
    || 'https://www.reddit.com/media?url=https%3A%2F%2Fpreview.redd.it%2Fpokemon-company-releasing-life-size-eeveelution-plushes-v0-98ft1tr8pvwe1.jpg%3Fwidth%3D640%26crop%3Dsmart%26auto%3Dwebp%26s%3D3239e42d1b8ab15657b75b4c55b46e557e161dc4';  // Placeholder se non c'è foto
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

  toggleEditable() {
    this.isEditable.set(!this.isEditable());
  }

  orientationOptions: { label: string; value: SexualOrientation }[] = [
    { label: 'Heterosexual', value: 'heterosexual' },
    { label: 'Homosexual', value: 'homosexual' },
    { label: 'Bisexual', value: 'bisexual' }
  ];
  genderOptions: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ];

  onLocationChange(ev: { lat: number; lng: number }) {
      this.location.set({ latitude: ev.lat, longitude: ev.lng });
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
