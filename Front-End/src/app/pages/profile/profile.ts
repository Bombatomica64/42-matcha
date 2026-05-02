import { Component, inject } from '@angular/core';
import { GetUserProfile } from '../../services/user/get-user-profile';
import { ProfileForm } from '../../components/forms/profile-form/profile-form';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { RatingModule } from 'primeng/rating';


import { adultValidator } from '../../components/forms/register-form/register-form';
import { SelectModule } from 'primeng/select';
import { components } from '../../../types/api';
import { Card } from "../../components/card/card";
import { UserImages } from "../../components/user-images/user-images";


type User = components['schemas']['User'];
// type SexualOrientation = User['sexual_orientation'];
// type Gender = User['gender'];
type PhotoResponse = components['schemas']['PhotoResponse'];//post
type GetPhotoResponse = components['schemas']['PhotoListResponse'];//get
type ErrorResponse = components['schemas']['ErrorResponse'];

// type ErrorResponse = components['schemas']['ErrorResponse'];

@Component({
  selector: 'app-profile',
  imports: [
    CardModule,
    ButtonModule,
    SelectModule,
    BadgeModule,
    OverlayBadgeModule,
    Card,
    ProfileForm,
    RatingModule,
    FormsModule,
    UserImages,
],
  template: `
    <div class="page-outer">
      <div class="page-center">

        <!-- colonna sinistra: card + immagini, fissa -->
        <div class="left-col">
          <div style="padding: 1rem;">
            <app-card [user]="profileService.profile()"/>
            <app-user-images [images]="profileService.profile().photos" />
          </div>
        </div>

        <!-- colonna destra: tutto il resto, scrollabile -->
        <div class="right-col">
          <p>{{ profileService.profile().name }}</p>

          <app-profile-form />

          <p>Hashtags: {{ profileService.profile().hashtags }}</p>

          <div class="stat-row">
            <span>Fame Rating:</span>
            <p-rating [ngModel]="profileService.profile().fame_rating" [readonly]="true" style="pointer-events: none;" />
          </div>
          <div class="stat-row">
            <span>Likes Received:</span>
            <p-button [rounded]="true" size="small" label="{{profileService.profile().likes_received}}" icon="pi pi-thumbs-up" severity="success" iconPos="right"/>
          </div>
          <div class="stat-row">
            <span>Views:</span>
            <p-button [rounded]="true" size="small" label="{{profileService.profile().views}}" icon="pi pi-eye" severity="info" iconPos="right"/>
          </div>
          <div class="stat-row">
            <span>Matches:</span>
            <p-button [rounded]="true" size="small" label="{{profileService.profile().matches}}" icon="pi pi-heart" severity="warn" iconPos="right"/>
          </div>

          <p-button label="Change Password" icon="pi pi-lock" severity="secondary"></p-button>
        </div>

      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }
    .page-outer {
      display: flex;
      justify-content: center;
      height: 100%;
      padding: 0 2rem;
      box-sizing: border-box;
    }
    .page-center {
      display: flex;
      flex-direction: row;
      gap: 2rem;
      width: 100%;
      max-width: 900px;
      height: 100%;
    }
    .left-col {
      flex: 0 0 auto;
      width: 320px;
      display: flex;
      flex-direction: column;
      align-self: center;
    }
    .right-col {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
      padding: 1rem 0.5rem 1rem 0;
      scrollbar-width: thin;
      scrollbar-color: #555 transparent;
    }
    .right-col::-webkit-scrollbar {
      width: 8px;
    }
    .right-col::-webkit-scrollbar-track {
      background: transparent;
    }
    .right-col::-webkit-scrollbar-thumb {
      background-color: #555;
      border-radius: 4px;
    }
    .stat-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `,
})
export class Profile {
  profileService = inject(GetUserProfile);
}
